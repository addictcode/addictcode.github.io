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
  LineLoop,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  ShaderMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
} from 'three'
import { onSystemEvent, type SystemEvent } from '../system/bus'
import {
  CHAPTER_FOCUS,
  EDGES,
  edgePoints,
  EXPLORE_SHOT,
  LANE_Z,
  LANES,
  NODE_IDS,
  NODES,
  OVERVIEW_CHAPTERS,
  pathLength,
  pointAlong,
  SHOTS,
  type NodeId,
  type Point,
  type Shot,
} from '../system/graph'
import { getHovered, placeHotspot } from '../system/hotspots'
import { getChapter, getExplore, isProjectPage } from '../system/view'
import {
  dashedGeometry,
  edgeGeometry,
  FLOOR_TEXT_ASPECT,
  floorTextTexture,
  FOOTPRINT,
  footprintGeometry,
  LABEL_ASPECT,
  labelTexture,
  padGeometry,
  solidGeometry,
  traceGeometry,
} from './geometry'
import { horizonGeometry } from './horizon'
import { nodeShape } from './nodeShapes'
import { LABEL_FONT, PALETTE } from './palette'

/** высота узла вне фокуса, доля от полной */
const LOW = 0.4
const LABEL_HEIGHT = 0.019
/** выносная линия от верха узла до подписи */
const LEADER = 1.4
const TRACE_WIDTH = 0.08
/** подложка шины: широкая тёмная полоса под тонкой дорожкой */
const BAND_WIDTH = 0.9
const PAD_SIZE = 0.42
/** узлы крупнее брусков, из которых собраны: на просторной карте они не теряются */
const NODE_SCALE = 1.2
const LANE_TEXT_HEIGHT = 1.05
const PACKET_Y = 0.14
const PACKET_SPEED = 10
const BEAT_SPEED = 5
const BEAT_EVERY = 0.4
const MAX_PACKETS = 64
const TRAIL = 4
const TRAIL_GAP = 0.2
const WIDE = 1100
/** страница проекта на широком экране: текст справа, карта сдвинута влево */
const SHIFT_PROJECT_X = 0.2
/** блок услуг на широком экране: слева заголовок и контакты, карта сдвинута вправо */
const SHIFT_EXPLORE_X = 0.06
/** первый экран главной: заголовок внизу, карта поднята */
const SHIFT_HERO_Y = 0.13
const SHIFT_Y_NARROW = 0.12
/** сборка карты при загрузке: длительность и задержка между узлами, секунды */
const INTRO_TIME = 1.1
const INTRO_STAGGER = 0.06
/** медленный поворот камеры, градусы и радианы в секунду */
const DRIFT_ANGLE = 7
const DRIFT_SPEED = 0.16
const SCAN_SIZE = 1.75
const RIPPLE_TIME = 1.6

const color = (hex: string) => new Color(hex)
const C = {
  solid: color(PALETTE.solid),
  solidOn: color(PALETTE.solidOn),
  edgeDim: color(PALETTE.edgeDim),
  edge: color(PALETTE.edge),
  trace: color(PALETTE.trace),
  band: color(PALETTE.band),
  bandOn: color(PALETTE.bandOn),
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
  uniform vec3 uAccent;
  uniform vec2 uPointer;
  uniform float uPointerOn;
  uniform vec3 uRipple;
  uniform float uTime;
  varying vec2 vWorld;
  float hash(float n) {
    return fract(sin(n * 127.1) * 43758.5453);
  }
  // по линиям сетки через 10 бегут короткие штрихи: у каждой линии своя скорость и направление
  float traffic(float along, float across, float index) {
    float w = fwidth(across);
    float onLine = 1.0 - smoothstep(0.0, w * 1.5, abs(across));
    float active = step(0.45, hash(index));
    float speed = (2.0 + hash(index + 7.0) * 5.0) * (hash(index + 3.0) > 0.5 ? 1.0 : -1.0);
    float dash = smoothstep(0.0, 0.25, fract(along / 24.0 - uTime * speed / 24.0 + hash(index + 11.0)));
    float head = dash * (1.0 - step(0.12, 1.0 - dash));
    return onLine * active * head;
  }
  // тонкие линии с шагом step
  float lines(vec2 p, float step) {
    vec2 w = fwidth(p) / step;
    vec2 g = abs(fract(p / step - 0.5) - 0.5) / w;
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    return line * (1.0 - smoothstep(0.2, 0.6, max(w.x, w.y)));
  }
  void main() {
    vec2 w = fwidth(vWorld);
    float px = max(w.x, w.y);
    // точки на каждом узле сетки, линии через 5 и крестики через 10
    vec2 cell = abs(fract(vWorld + 0.5) - 0.5);
    float dots = (1.0 - smoothstep(0.035, 0.035 + px * 1.2, length(cell))) * (1.0 - smoothstep(0.08, 0.25, px));
    vec2 ten = abs(fract(vWorld / 10.0 + 0.5) - 0.5) * 10.0;
    float crossX = (1.0 - smoothstep(0.0, w.x * 1.2, ten.x)) * step(ten.y, 0.55);
    float crossZ = (1.0 - smoothstep(0.0, w.y * 1.2, ten.y)) * step(ten.x, 0.55);
    float marks = max(crossX, crossZ);
    vec2 tenCell = floor(vWorld / 10.0 + 0.5);
    vec2 tenOff = vWorld - tenCell * 10.0;
    float flow = max(traffic(vWorld.x, tenOff.y, tenCell.y + 31.0), traffic(vWorld.y, tenOff.x, tenCell.x + 97.0));
    float pattern = dots * 0.75 + lines(vWorld, 5.0) * 0.32 + marks * 1.3 + flow * 1.6;
    float fade = 1.0 - smoothstep(uRadius * 0.25, uRadius, distance(vWorld, uFocus));
    // сетка ярче под курсором
    float near = (1.0 - smoothstep(0.0, 5.0, distance(vWorld, uPointer))) * uPointerOn;
    // волна от клика и от пришедшего пакета: кольцо расходится от точки uRipple.xy
    float age = uRipple.z;
    float ring = (1.0 - smoothstep(0.0, 1.6, abs(distance(vWorld, uRipple.xy) - age * 18.0))) * max(0.0, 1.0 - age / 1.6);
    vec3 tint = mix(uColor, uAccent, clamp(ring + near * 0.35 + flow * 0.25, 0.0, 1.0));
    gl_FragColor = vec4(tint, pattern * fade * (1.0 + near * 1.8 + ring * 3.0));
  }
`

const TRACE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uFlow;
  uniform float uTime;
  uniform float uLit;
  varying vec2 vWorld;
  // по дорожке бежит ток: светлые штрихи вдоль шины, у выбранного проекта ярче
  void main() {
    float dash = smoothstep(0.55, 1.0, fract((vWorld.x + vWorld.y) * 0.35 - uTime * 0.9));
    gl_FragColor = vec4(mix(uColor, uFlow * 1.25, dash * (0.35 + 0.65 * uLit)), 1.0);
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
    const points = edgePoints(edge.path).map(([x, z]) => new Vector3(x, PACKET_Y, z))
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
  // общее время для шейдеров: ток по шинам и движение по сетке
  const map0 = { time: { value: 0 } }
  const root = new Group()
  root.add(new AmbientLight(0xffffff, 2.2))
  const sun = new DirectionalLight(0xffffff, 3.2)
  sun.position.set(-6, 10, 5)
  root.add(sun)

  const footprint = footprintGeometry()
  const outline = padGeometry([[0, 0]], FOOTPRINT * 2)
  const outlineMat = new LineBasicMaterial({ color: C.edgeDim, transparent: true, opacity: 0.45 })
  const ledGeometry = new BoxGeometry(0.22, 0.12, 0.22)
  const leaderGeometry = new BufferGeometry()
  leaderGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3))
  const scanGeometry = new BufferGeometry()
  const h = SCAN_SIZE
  scanGeometry.setAttribute('position', new Float32BufferAttribute([-h, 0, -h, h, 0, -h, h, 0, h, -h, 0, h], 3))
  const nodes = NODE_IDS.map((id) => {
    const shape = nodeShape(id)
    const def = NODES[id]
    const group = new Group()
    group.position.set(def.x, 0, def.z)
    group.scale.setScalar(NODE_SCALE)
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
    const edges = edgeGeometry(shape.boxes)
    // отражение в «полу»: те же рёбра, перевёрнутые и приглушённые
    const mirrorMat = new LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.16, depthWrite: false })
    const mirror = new LineSegments(edges, mirrorMat)
    mirror.scale.y = -1
    const body = new Group()
    body.add(new Mesh(solidGeometry(shape.boxes), solidMat), new LineSegments(edges, edgeMat), mirror)
    // рамка, которая ходит вверх-вниз по узлу в фокусе
    const scanMat = new LineBasicMaterial({ color: C.accent, transparent: true, opacity: 0, depthWrite: false })
    const scan = new LineLoop(scanGeometry, scanMat)
    const label = new Sprite(labelMat)
    label.scale.set(LABEL_HEIGHT * LABEL_ASPECT, LABEL_HEIGHT, 1)
    // подпись начинается от выносной линии и идёт вправо
    label.center.set(0.012, 0.5)
    label.renderOrder = 10
    const leaderMat = new LineBasicMaterial({ color: C.edgeDim, transparent: true })
    const leader = new LineSegments(leaderGeometry, leaderMat)
    // огонёк статуса в углу площадки: мигает, когда в узел приходит пакет
    const ledMat = new MeshBasicMaterial({ color: C.edgeDim, fog: false })
    const led = new Mesh(ledGeometry, ledMat)
    led.position.set(FOOTPRINT - 0.35, 0.06, FOOTPRINT - 0.35)
    group.add(body, new LineSegments(footprint, footMat), new LineSegments(outline, outlineMat), label, leader, scan, led)
    root.add(group)
    return { id, body, solidMat, edgeMat, mirrorMat, footMat, label, labelMat, leader, leaderMat, scan, scanMat, ledMat, height: shape.height, lift: 1, focus: 0, kick: 0, hover: 0 }
  })

  // связи: тонкая дорожка поверх широкой тёмной шины, у входа в узел — контактная площадка
  const ports: Point[] = []
  const traces = EDGES.map((edge) => {
    const points = edgePoints(edge.path)
    const material = new ShaderMaterial({
      vertexShader: GRID_VERTEX,
      fragmentShader: TRACE_FRAGMENT,
      uniforms: { uColor: { value: C.trace.clone() }, uFlow: { value: C.traceOn.clone() }, uTime: map0.time, uLit: { value: 0 } },
    })
    const bandMaterial = new MeshBasicMaterial({ color: C.band, transparent: true, opacity: 0.9, depthWrite: false })
    const band = new Mesh(traceGeometry(points, BAND_WIDTH, 0.005), bandMaterial)
    band.renderOrder = -0.5
    root.add(band, new Mesh(traceGeometry(points, TRACE_WIDTH, 0.02), material))
    const length = pathLength(points)
    const port = FOOTPRINT * NODE_SCALE + 0.4
    ports.push(pointAlong(points, port), pointAlong(points, length - port))
    for (let i = 1; i < edge.path.length - 1; i += 1) ports.push(edge.path[i])
    return { material, bandMaterial, from: NODE_IDS.indexOf(edge.from), to: NODE_IDS.indexOf(edge.to) }
  })
  const unique = ports.filter(([x, z], i) => ports.findIndex(([ox, oz]) => Math.hypot(ox - x, oz - z) < 0.3) === i)
  root.add(new LineSegments(padGeometry(unique, PAD_SIZE), new LineBasicMaterial({ color: color(PALETTE.pad) })))

  // колонки карты: пунктирные границы и подписи, напечатанные на «полу» у дальнего края
  const [far, near] = LANE_Z
  const bounds = [...new Set(LANES.flatMap((lane) => [lane.from, lane.to]))]
  const laneMat = new LineBasicMaterial({ color: color(PALETTE.lane) })
  root.add(new LineSegments(dashedGeometry(bounds.map((x) => [[x, far], [x, near]]), 0.5), laneMat))
  root.add(new LineSegments(dashedGeometry([[[bounds[0], far], [bounds[bounds.length - 1], far]]], 0.25), laneMat))
  for (const lane of LANES) {
    const material = new MeshBasicMaterial({
      map: floorTextTexture(lane.label, LABEL_FONT),
      color: color(PALETTE.laneText),
      transparent: true,
      depthWrite: false,
    })
    const width = LANE_TEXT_HEIGHT * FLOOR_TEXT_ASPECT
    const text = new Mesh(new PlaneGeometry(width, LANE_TEXT_HEIGHT).rotateX(-Math.PI / 2), material)
    text.position.set(lane.from + 0.6 + width / 2, 0.02, far + 1.2)
    root.add(text)
  }

  const grid = new ShaderMaterial({
    vertexShader: GRID_VERTEX,
    fragmentShader: GRID_FRAGMENT,
    uniforms: {
      uColor: { value: color(PALETTE.grid) },
      uAccent: { value: color(PALETTE.accent) },
      uFocus: { value: new Vector2() },
      uRadius: { value: 60 },
      uPointer: { value: new Vector2() },
      uPointerOn: { value: 0 },
      uRipple: { value: new Vector3(0, 0, 99) },
      uTime: map0.time,
    },
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

  // «серверный город» на горизонте: низкие стойки вокруг карты, их съедает туман
  const horizon = horizonGeometry()
  const horizonSolid = new Mesh(horizon.solid, new MeshLambertMaterial({ color: C.solid }))
  const horizonEdges = new LineSegments(horizon.edges, new LineBasicMaterial({ color: color(PALETTE.horizon) }))
  root.add(horizonSolid, horizonEdges)

  // подложки колонок: через одну чуть светлее пола, чтобы колонки читались как полосы
  LANES.forEach((lane, i) => {
    if (i % 2) return
    const plate = new Mesh(
      new PlaneGeometry(lane.to - lane.from, near - far).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ color: color(PALETTE.lanePlate), transparent: true, opacity: 0.22, depthWrite: false }),
    )
    plate.position.set((lane.from + lane.to) / 2, 0.002, (far + near) / 2)
    plate.renderOrder = -0.8
    root.add(plate)
  })

  return { root, nodes, traces, grid, packetMesh, time: map0.time }
}

/** Вклад главы в состояние узла: в фокусе ли он и поднят ли в полный рост. */
function chapterState(chapter: number, id: NodeId): [focus: number, lift: number] {
  const focused = CHAPTER_FOCUS[chapter].includes(id)
  const overview = OVERVIEW_CHAPTERS.includes(chapter)
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
  const clock = useRef(0)
  const shift = useRef({ x: 0, y: 0, started: false })
  const pointerOn = useRef(false)
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

  useEffect(() => () => (camera as PerspectiveCamera).clearViewOffset(), [camera])

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
      if (event.broadcast) {
        EDGES.forEach((edge) => spawn([edge.from, edge.to], C.accent, PACKET_SPEED, 0.2))
        map.grid.uniforms.uRipple.value.set(rig.current.x, rig.current.z, 0)
      }
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
      pointerOn.current = true
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
  const raycaster = useMemo(() => new Raycaster(), [])
  const groundPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), [])
  const ndc = useMemo(() => new Vector2(), [])

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const chapter = still ? (posterChapter as number) : getChapter()
    const ease = (lambda: number) => (still || !rig.current.started ? 1 : 1 - Math.exp(-lambda * dt))
    if (!still) clock.current += dt
    const time = clock.current
    const wide = size.width >= WIDE
    const project = still ? !OVERVIEW_CHAPTERS.includes(posterChapter as number) : isProjectPage()
    const explore = still ? 0 : getExplore()

    // точка схода: на странице проекта карта левее центра, на первом экране главной выше
    const wantX = wide ? (project ? SHIFT_PROJECT_X : -SHIFT_EXPLORE_X * explore) : 0
    const wantY = wide ? (project ? 0.03 : SHIFT_HERO_Y * (1 - explore) * (chapter === null ? 1 : 0.3)) : SHIFT_Y_NARROW
    const sh = shift.current
    const kShift = still || !sh.started ? 1 : 1 - Math.exp(-3.2 * dt)
    sh.x += (wantX - sh.x) * kShift
    sh.y += (wantY - sh.y) * kShift
    sh.started = true
    ;(camera as PerspectiveCamera).setViewOffset(size.width, size.height, size.width * sh.x, size.height * sh.y, size.width, size.height)

    // камера: на проекте стоит у его узла, иначе общий вид, который опускается к карте по скроллу
    const want = chapter === null ? mixShot(SHOTS[0], EXPLORE_SHOT, explore) : SHOTS[chapter]
    const r = rig.current
    const k = ease(3.2)
    r.x += (want.x - r.x) * k
    r.z += (want.z - r.z) * k
    r.dist += (want.dist - r.dist) * k
    // в блоке услуг поворот почти стихает: подписи у узлов не уплывают, пока их читают
    const drift = Math.sin(time * DRIFT_SPEED) * DRIFT_ANGLE * (chapter === null ? 1 - 0.9 * explore : 0.5)
    r.azimuth += (want.azimuth + drift + pointer.current.x * 5 - r.azimuth) * k
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
    camera.updateMatrixWorld()
    const fog = scene.fog as Fog | null
    if (fog) {
      fog.near = dist * 0.95
      fog.far = dist * 2.3
    }
    map.grid.uniforms.uFocus.value.set(r.x, r.z)
    map.grid.uniforms.uRadius.value = dist * 1.15
    const ripple = map.grid.uniforms.uRipple.value as Vector3
    if (ripple.z < RIPPLE_TIME) ripple.z += dt
    // курсор на «полу»: сетка под ним ярче
    const pointerUniform = map.grid.uniforms.uPointerOn
    pointerUniform.value += ((pointerOn.current ? 1 : 0) - pointerUniform.value) * ease(4)
    if (pointerOn.current) {
      raycaster.setFromCamera(ndc.set(pointer.current.x, -pointer.current.y), camera)
      if (raycaster.ray.intersectPlane(groundPlane, point)) (map.grid.uniforms.uPointer.value as Vector2).set(point.x, point.z)
    }

    map.time.value = time
    const hovered = still ? null : getHovered()

    // узлы
    const kNode = ease(5)
    map.nodes.forEach((node, index) => {
      const [focus, lift] = chapterState(chapter ?? 0, node.id)
      // при загрузке узлы поднимаются из «пола» по очереди
      const grown = still ? 1 : MathUtils.smoothstep((time - index * INTRO_STAGGER) / INTRO_TIME, 0, 1)
      node.focus += (focus - node.focus) * kNode
      node.lift += (lift * grown - node.lift) * (still ? 1 : 1 - Math.exp(-9 * dt))
      node.kick = Math.max(0, node.kick - dt * 2.2)
      node.hover += ((hovered === node.id ? 1 : 0) - node.hover) * kNode
      const bump = 1 + node.kick * 0.05 + node.hover * 0.06
      node.body.scale.set(bump, Math.max(0.001, node.lift * bump), bump)
      node.scan.position.y = (0.5 + 0.5 * Math.sin(time * 1.7 + index)) * node.height * node.lift
      node.scanMat.opacity = still ? 0 : node.focus * 0.9
      const top = node.height * node.lift
      node.leader.position.y = top + 0.2
      node.leader.scale.y = LEADER - 0.2
      node.label.position.y = top + LEADER
      const raised = (node.lift - LOW) / (1 - LOW)
      mixed.lerpColors(C.edgeDim, C.edge, raised)
      node.edgeMat.color.copy(mixed).lerp(C.accent, Math.max(node.focus, node.kick * 0.9, node.hover * 0.75))
      node.mirrorMat.color.copy(node.edgeMat.color)
      node.solidMat.color.lerpColors(C.solid, C.solidOn, node.focus)
      node.footMat.color.lerpColors(C.edgeDim, C.accent, Math.max(node.focus, node.hover))
      node.labelMat.color.lerpColors(C.label, C.labelOn, Math.max(node.focus, node.kick, node.hover))
      node.labelMat.opacity = 0.45 + 0.55 * Math.max(raised, node.focus, node.hover)
      // огонёк: ровно тлеет, вспыхивает от пришедшего пакета, у выбранного узла горит
      const idle = still ? 0.6 : 0.45 + 0.35 * Math.sin(time * 1.3 + index * 1.7)
      node.ledMat.color.lerpColors(C.edgeDim, C.edge, idle).lerp(C.accent, Math.min(1, Math.max(node.kick, node.focus * 0.9, node.hover)))
      node.leaderMat.color.lerpColors(C.edgeDim, C.accent, Math.max(node.focus, node.kick))
      // кнопка и подпись узла в интерфейсе привязаны к его основанию
      point.set(NODES[node.id].x, 0, NODES[node.id].z).project(camera)
      placeHotspot(node.id, (point.x * 0.5 + 0.5) * size.width, (0.5 - point.y * 0.5) * size.height, point.z < 1)
    })
    map.traces.forEach((trace) => {
      const lit = Math.max(map.nodes[trace.from].focus, map.nodes[trace.to].focus)
      ;(trace.material.uniforms.uColor.value as Color).lerpColors(C.trace, C.traceOn, lit)
      trace.material.uniforms.uLit.value = lit
      trace.bandMaterial.color.lerpColors(C.band, C.bandOn, lit)
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
        if (packet.color === C.accent && packet.leg === packet.legs.length - 1) ripple.set(NODES[arrived.id].x, NODES[arrived.id].z, 0.25)
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
