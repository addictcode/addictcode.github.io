import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
} from 'three'
import { onSystemEvent, type SystemEvent } from '../system/bus'
import { CHAPTER_FOCUS, EDGES, NODE_IDS, NODES, SHOTS, type NodeId, type Shot } from '../system/graph'
import { getProgress } from '../system/progress'
import { edgeGeometry, footprintGeometry, LABEL_ASPECT, labelTexture, solidGeometry, traceGeometry } from './geometry'
import { nodeShape } from './nodeShapes'
import { LABEL_FONT, PALETTE } from './palette'

/** высота узла вне фокуса, доля от полной */
const LOW = 0.4
const LABEL_HEIGHT = 0.02
const PACKET_Y = 0.14
const PACKET_SPEED = 10
const BEAT_SPEED = 5
const BEAT_EVERY = 1.3
const MAX_PACKETS = 40
const TRAIL = 4
const TRAIL_GAP = 0.2
/** на широком экране карта сдвинута вправо, текст стоит слева */
const WIDE = 1100
const SHIFT_X = 0.22
const SHIFT_Y_WIDE = 0.05
const SHIFT_Y_NARROW = 0.12

const color = (hex: string) => new Color(hex)
const C = {
  solid: color(PALETTE.solid),
  solidOn: color(PALETTE.solidOn),
  edgeDim: color(PALETTE.edgeDim),
  edge: color(PALETTE.edge),
  trace: color(PALETTE.trace),
  traceOn: color(PALETTE.traceOn),
  label: color(PALETTE.label),
  labelOn: color(PALETTE.labelOn),
  accent: color(PALETTE.accent),
  beat: color(PALETTE.beat),
}

const GRID_VERTEX = /* glsl */ `
  varying vec2 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`
const GRID_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec2 uFocus;
  uniform float uRadius;
  varying vec2 vWorld;
  float grid(vec2 p) {
    vec2 w = fwidth(p);
    vec2 g = abs(fract(p - 0.5) - 0.5) / w;
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    return line * (1.0 - smoothstep(0.25, 0.7, max(w.x, w.y)));
  }
  void main() {
    float lines = grid(vWorld) * 0.5 + grid(vWorld / 5.0) * 0.9;
    float fade = 1.0 - smoothstep(uRadius * 0.3, uRadius, distance(vWorld, uFocus));
    gl_FragColor = vec4(uColor, lines * fade);
  }
`

interface Leg {
  points: Vector3[]
  total: number
  to: NodeId
}

interface Packet {
  legs: Leg[]
  leg: number
  dist: number
  speed: number
  color: Color
  size: number
}

function buildLegs(): Map<string, Leg> {
  const legs = new Map<string, Leg>()
  const measure = (points: Vector3[]) => points.slice(1).reduce((sum, point, i) => sum + point.distanceTo(points[i]), 0)
  for (const edge of EDGES) {
    const points = edge.path.map(([x, z]) => new Vector3(x, PACKET_Y, z))
    const total = measure(points)
    legs.set(`${edge.from}>${edge.to}`, { points, total, to: edge.to })
    legs.set(`${edge.to}>${edge.from}`, { points: [...points].reverse(), total, to: edge.from })
  }
  return legs
}

function sampleLeg(leg: Leg, dist: number, out: Vector3): void {
  let rest = dist
  for (let i = 0; i < leg.points.length - 1; i += 1) {
    const a = leg.points[i]
    const b = leg.points[i + 1]
    const length = a.distanceTo(b)
    if (rest <= length || i === leg.points.length - 2) {
      out.lerpVectors(a, b, Math.min(1, rest / length))
      return
    }
    rest -= length
  }
}

function buildMap() {
  const root = new Group()
  root.add(new AmbientLight(0xffffff, 2.2))
  const sun = new DirectionalLight(0xffffff, 3.2)
  sun.position.set(-6, 10, 5)
  root.add(sun)

  const footprint = footprintGeometry()
  const nodes = NODE_IDS.map((id) => {
    const shape = nodeShape(id)
    const def = NODES[id]
    const group = new Group()
    group.position.set(def.x, 0, def.z)
    const solidMat = new MeshLambertMaterial({ color: C.solid, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
    const edgeMat = new LineBasicMaterial({ color: C.edge })
    const footMat = new LineBasicMaterial({ color: C.edgeDim })
    const labelMat = new SpriteMaterial({
      map: labelTexture(def.label, LABEL_FONT),
      color: C.label,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: false,
      fog: false,
    })
    const body = new Group()
    body.add(new Mesh(solidGeometry(shape.boxes), solidMat), new LineSegments(edgeGeometry(shape.boxes), edgeMat))
    const label = new Sprite(labelMat)
    label.scale.set(LABEL_HEIGHT * LABEL_ASPECT, LABEL_HEIGHT, 1)
    label.renderOrder = 10
    group.add(body, new LineSegments(footprint, footMat), label)
    root.add(group)
    return { id, body, solidMat, edgeMat, footMat, label, labelMat, height: shape.height, lift: 1, focus: 0, kick: 0 }
  })

  const traces = EDGES.map((edge) => {
    const material = new MeshBasicMaterial({ color: C.trace })
    root.add(new Mesh(traceGeometry(edge.path), material))
    return { material, from: NODE_IDS.indexOf(edge.from), to: NODE_IDS.indexOf(edge.to) }
  })

  const grid = new ShaderMaterial({
    vertexShader: GRID_VERTEX,
    fragmentShader: GRID_FRAGMENT,
    uniforms: { uColor: { value: color(PALETTE.grid) }, uFocus: { value: new Vector2() }, uRadius: { value: 40 } },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  })
  const ground = new Mesh(new PlaneGeometry(400, 400).rotateX(-Math.PI / 2), grid)
  ground.renderOrder = -1
  root.add(ground)

  const packetMesh = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ fog: false }), MAX_PACKETS * TRAIL)
  packetMesh.count = 0
  packetMesh.frustumCulled = false
  root.add(packetMesh)

  return { root, nodes, traces, grid, packetMesh }
}

/** Вклад главы в состояние узла: в фокусе ли он и поднят ли в полный рост. */
function chapterState(chapter: number, id: NodeId): [focus: number, lift: number] {
  const focused = CHAPTER_FOCUS[chapter].includes(id)
  const overview = chapter === 0 || chapter === CHAPTER_FOCUS.length - 1
  return [focused ? 1 : 0, focused || overview ? 1 : LOW]
}

const mixShot = (a: Shot, b: Shot, f: number): Shot => ({
  x: MathUtils.lerp(a.x, b.x, f),
  z: MathUtils.lerp(a.z, b.z, f),
  dist: MathUtils.lerp(a.dist, b.dist, f),
  azimuth: MathUtils.lerp(a.azimuth, b.azimuth, f),
  polar: MathUtils.lerp(a.polar, b.polar, f),
  narrow: MathUtils.lerp(a.narrow, b.narrow, f),
})

interface SystemSceneProps {
  /** служебный режим: карта замерла на этой главе, пакетов нет */
  posterChapter: number | null
  onReady: () => void
}

/** Карта системы: узлы, связи, пакеты и камера, которая идёт по узлам вслед за скроллом. */
export function SystemScene({ posterChapter, onReady }: SystemSceneProps) {
  const map = useMemo(buildMap, [])
  const legs = useMemo(buildLegs, [])
  const packets = useRef<Packet[]>([])
  const pointer = useRef({ x: 0, y: 0 })
  const rig = useRef<Shot & { started: boolean }>({ ...SHOTS[0], started: false })
  const frames = useRef(0)
  const beat = useRef(0)
  const beatRef = useRef<() => void>(() => undefined)
  const { camera, scene, size } = useThree()
  const still = posterChapter !== null

  useEffect(() => {
    scene.fog = new Fog(PALETTE.bg, 10, 120)
    return () => {
      scene.fog = null
      map.root.traverse((object) => {
        const item = object as Mesh
        item.geometry?.dispose()
        const material = item.material as SpriteMaterial | undefined
        material?.map?.dispose()
        material?.dispose()
      })
    }
  }, [scene, map])

  // сдвиг точки схода: карта стоит правее (широкий экран) или выше (узкий) центра
  useEffect(() => {
    const view = camera as PerspectiveCamera
    const wide = size.width >= WIDE
    view.setViewOffset(
      size.width,
      size.height,
      wide ? -size.width * SHIFT_X : 0,
      size.height * (wide ? SHIFT_Y_WIDE : SHIFT_Y_NARROW),
      size.width,
      size.height,
    )
    return () => view.clearViewOffset()
  }, [camera, size])

  // подписи перерисовываются, когда загрузится шрифт
  useEffect(() => {
    let cancelled = false
    document.fonts.load(`500 52px ${LABEL_FONT}`).then(() => {
      if (cancelled) return
      map.nodes.forEach((node) => {
        node.labelMat.map?.dispose()
        node.labelMat.map = labelTexture(NODES[node.id].label, LABEL_FONT)
      })
    })
    return () => {
      cancelled = true
    }
  }, [map])

  useEffect(() => {
    if (still) return
    const spawn = (path: NodeId[], tint: Color, speed: number, scale: number) => {
      const route: Leg[] = []
      for (let i = 0; i < path.length - 1; i += 1) {
        const leg = legs.get(`${path[i]}>${path[i + 1]}`)
        if (leg) route.push(leg)
      }
      if (route.length === 0) return
      if (packets.current.length >= MAX_PACKETS) packets.current.shift()
      packets.current.push({ legs: route, leg: 0, dist: 0, speed, color: tint, size: scale })
    }
    const stop = onSystemEvent((event: SystemEvent) => {
      if (event.route) spawn(event.route, C.accent, PACKET_SPEED, 0.2)
      if (event.broadcast) EDGES.forEach((edge) => spawn([edge.from, edge.to], C.accent, PACKET_SPEED, 0.2))
      event.kick?.forEach((id) => {
        map.nodes[NODE_IDS.indexOf(id)].kick = 1
      })
    })
    const heartbeat = () => {
      const edge = EDGES[Math.floor(Math.random() * EDGES.length)]
      spawn(Math.random() < 0.5 ? [edge.from, edge.to] : [edge.to, edge.from], C.beat, BEAT_SPEED, 0.11)
    }
    beatRef.current = heartbeat
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      stop()
      window.removeEventListener('pointermove', onPointer)
    }
  }, [legs, map, still])

  const dummy = useMemo(() => new Object3D(), [])
  const point = useMemo(() => new Vector3(), [])
  const mixed = useMemo(() => new Color(), [])

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const p = MathUtils.clamp(still ? (posterChapter as number) : getProgress(), 0, SHOTS.length - 1)
    const lo = Math.floor(p)
    const hi = Math.min(SHOTS.length - 1, lo + 1)
    const f = p - lo
    const ease = (lambda: number) => (still || !rig.current.started ? 1 : 1 - Math.exp(-lambda * dt))

    // камера
    const want = mixShot(SHOTS[lo], SHOTS[hi], f)
    const r = rig.current
    const k = ease(3.2)
    r.x += (want.x - r.x) * k
    r.z += (want.z - r.z) * k
    r.dist += (want.dist - r.dist) * k
    r.azimuth += (want.azimuth + pointer.current.x * 5 - r.azimuth) * k
    r.polar += (want.polar - pointer.current.y * 2.5 - r.polar) * k
    r.narrow += (want.narrow - r.narrow) * k
    r.started = true
    // на узком экране карта дальше, чтобы узел помещался по ширине
    const dist = r.dist * (size.width < WIDE ? r.narrow : 1)
    const azimuth = MathUtils.degToRad(r.azimuth)
    const polar = MathUtils.degToRad(r.polar)
    camera.position.set(
      r.x + dist * Math.sin(polar) * Math.sin(azimuth),
      dist * Math.cos(polar),
      r.z + dist * Math.sin(polar) * Math.cos(azimuth),
    )
    camera.lookAt(r.x, 0.8, r.z)
    const fog = scene.fog as Fog | null
    if (fog) {
      fog.near = dist * 0.95
      fog.far = dist * 2.3
    }
    map.grid.uniforms.uFocus.value.set(r.x, r.z)
    map.grid.uniforms.uRadius.value = dist * 1.15

    // узлы
    const kNode = ease(5)
    map.nodes.forEach((node) => {
      const [focusA, liftA] = chapterState(lo, node.id)
      const [focusB, liftB] = chapterState(hi, node.id)
      node.focus += (MathUtils.lerp(focusA, focusB, f) - node.focus) * kNode
      node.lift += (MathUtils.lerp(liftA, liftB, f) - node.lift) * kNode
      node.kick = Math.max(0, node.kick - dt * 2.2)
      const bump = 1 + node.kick * 0.05
      node.body.scale.set(bump, node.lift * bump, bump)
      node.label.position.y = node.height * node.lift + 0.55
      const raised = (node.lift - LOW) / (1 - LOW)
      mixed.lerpColors(C.edgeDim, C.edge, raised)
      node.edgeMat.color.copy(mixed).lerp(C.accent, Math.max(node.focus, node.kick * 0.9))
      node.solidMat.color.lerpColors(C.solid, C.solidOn, node.focus)
      node.footMat.color.lerpColors(C.edgeDim, C.accent, node.focus)
      node.labelMat.color.lerpColors(C.label, C.labelOn, Math.max(node.focus, node.kick))
      node.labelMat.opacity = 0.45 + 0.55 * Math.max(raised, node.focus)
    })
    map.traces.forEach((trace) => {
      trace.material.color.lerpColors(C.trace, C.traceOn, Math.max(map.nodes[trace.from].focus, map.nodes[trace.to].focus))
    })

    // пакеты
    if (!still) {
      beat.current += dt
      if (beat.current > BEAT_EVERY) {
        beat.current = 0
        beatRef.current()
      }
    }
    let count = 0
    packets.current = packets.current.filter((packet) => {
      packet.dist += packet.speed * dt
      while (packet.dist > packet.legs[packet.leg].total) {
        packet.dist -= packet.legs[packet.leg].total
        const arrived = map.nodes[NODE_IDS.indexOf(packet.legs[packet.leg].to)]
        if (packet.color === C.accent) arrived.kick = 1
        packet.leg += 1
        if (packet.leg >= packet.legs.length) return false
      }
      for (let i = 0; i < TRAIL; i += 1) {
        const dist = packet.dist - i * TRAIL_GAP
        if (dist < 0) break
        sampleLeg(packet.legs[packet.leg], dist, point)
        dummy.position.copy(point)
        dummy.scale.setScalar(packet.size * (1 - i / (TRAIL + 1)))
        dummy.updateMatrix()
        map.packetMesh.setMatrixAt(count, dummy.matrix)
        map.packetMesh.setColorAt(count, packet.color)
        count += 1
      }
      return true
    })
    map.packetMesh.count = count
    map.packetMesh.instanceMatrix.needsUpdate = true
    if (map.packetMesh.instanceColor) map.packetMesh.instanceColor.needsUpdate = true

    frames.current += 1
    if (frames.current === 3) onReady()
  })

  return <primitive object={map.root} />
}
