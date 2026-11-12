import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  MathUtils,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from 'three'
import { onSystemEvent } from '../system/bus'
import { SHAPES, type ShapeId } from '../system/graph'
import { getHero, getShape, isProjectPage } from '../system/view'
import { PALETTE } from './palette'
import { buildShape, random, STEP, type ShapeData } from './shapes'

const CUBE = STEP * 0.8
/** перестройка: длительность полёта кубика и разброс старта, секунды */
const FLIGHT = 1.25
const STAGGER = 0.55
/** высота дуги, по которой кубик летит в новую форму */
const ARC = 2.4
/** кубики расступаются вокруг курсора: радиус и сила */
const PUSH_RADIUS = 2.2
const PUSH = 1.1
/** покачивание фигуры вокруг удобного ракурса: амплитуда и скорость */
const SWAY = MathUtils.degToRad(28)
const SWAY_SPEED = 0.22
const FACING = MathUtils.degToRad(-24)
const WIDE = 900

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

interface Voxels {
  /** откуда летит, куда и текущее положение каждого кубика */
  from: Float32Array
  to: Float32Array
  current: Float32Array
  fromScale: Float32Array
  toScale: Float32Array
  scale: Float32Array
  fromAccent: Float32Array
  toAccent: Float32Array
  /** когда кубик стартует к новой форме, секунды сцены */
  start: Float32Array
  /** направление дуги полёта и фаза покачивания */
  arc: Float32Array
  phase: Float32Array
  /** смещение от курсора, сглаженное */
  push: Float32Array
}

function makeVoxels(count: number): Voxels {
  const rand = random(42)
  const arc = new Float32Array(count * 3)
  const phase = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    arc.set([rand() - 0.5, 0.6 + rand() * 0.6, rand() - 0.5], i * 3)
    phase[i] = rand() * Math.PI * 2
  }
  const vec = () => new Float32Array(count * 3)
  const one = () => new Float32Array(count)
  return { from: vec(), to: vec(), current: vec(), fromScale: one(), toScale: one(), scale: one(), fromAccent: one(), toAccent: one(), start: one(), arc, phase, push: vec() }
}

interface VoxelSceneProps {
  /** служебный режим: фигура замерла в этой форме, без сборки и анимации */
  posterShape: ShapeId | null
  onReady: () => void
}

/** Скульптура из кубиков: собирается в форму текущего раздела, расступается перед курсором. */
export function VoxelScene({ posterShape, onReady }: VoxelSceneProps) {
  const { camera, size } = useThree()
  const narrow = size.width < WIDE
  const count = narrow ? 1100 : 1800
  const still = posterShape !== null

  const shapes = useMemo(() => {
    const out = new Map<ShapeId, ShapeData>()
    SHAPES.forEach((id) => out.set(id, buildShape(id, count)))
    return out
  }, [count])
  const voxels = useMemo(() => makeVoxels(count), [count])

  const scene = useMemo(() => {
    const root = new Group()
    root.add(new AmbientLight(0xffffff, 0.8))
    const key = new DirectionalLight(0xffffff, 2.8)
    key.position.set(5, 8, 7)
    // контровой оранжевый свет сзади очерчивает грани
    const rim = new DirectionalLight(PALETTE.accent, 1.3)
    rim.position.set(-7, 3, -6)
    const under = new DirectionalLight('#6d7c8f', 0.8)
    under.position.set(0, -6, 3)
    root.add(key, rim, under)
    const figure = new Group()
    const material = new MeshStandardMaterial({ roughness: 0.42, metalness: 0.25 })
    const mesh = new InstancedMesh(new BoxGeometry(CUBE, CUBE, CUBE), material, count)
    mesh.frustumCulled = false
    figure.add(mesh)
    root.add(figure)
    return { root, figure, mesh, material }
  }, [count])

  useEffect(
    () => () => {
      scene.mesh.geometry.dispose()
      scene.material.dispose()
      scene.mesh.dispose()
    },
    [scene],
  )

  const clock = useRef(0)
  const shown = useRef<ShapeId | null>(null)
  const frames = useRef(0)
  const pointer = useRef({ x: 0, y: 0, on: false })
  const tilt = useRef({ x: 0, y: 0 })
  const pulse = useRef(99)
  const place = useRef({ x: 0, y: 0, scale: 1, started: false })

  useEffect(() => {
    if (still) return
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1
      pointer.current.on = true
    }
    const onLeave = () => {
      pointer.current.on = false
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    // действие посетителя в демо или на странице: по фигуре проходит волна
    const stop = onSystemEvent(() => {
      pulse.current = 0
    })
    return () => {
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerleave', onLeave)
      stop()
    }
  }, [still])

  useEffect(() => () => (camera as PerspectiveCamera).clearViewOffset(), [camera])

  const dummy = useMemo(() => new Object3D(), [])
  const color = useMemo(() => new Color(), [])
  const base = useMemo(() => new Color(PALETTE.cube), [])
  const accent = useMemo(() => new Color(PALETTE.accent), [])
  const raycaster = useMemo(() => new Raycaster(), [])
  const plane = useMemo(() => new Plane(), [])
  const hit = useMemo(() => new Vector3(), [])
  const local = useMemo(() => new Vector3(), [])
  const inverse = useMemo(() => new Matrix4(), [])
  const ndc = useMemo(() => new Vector2(), [])
  const normal = useMemo(() => new Vector3(), [])

  /** Новая форма: каждый кубик стартует из текущего места с небольшой задержкой снизу вверх. */
  const retarget = (id: ShapeId, now: number, scatter: boolean) => {
    const shape = shapes.get(id) as ShapeData
    const v = voxels
    const rand = random(now * 1000 + id.length)
    for (let i = 0; i < count; i += 1) {
      for (let k = 0; k < 3; k += 1) {
        // при первой сборке кубики слетаются издалека
        v.from[i * 3 + k] = scatter ? shape.positions[i * 3 + k] * 3 + (rand() - 0.5) * 30 : v.current[i * 3 + k]
        v.to[i * 3 + k] = shape.positions[i * 3 + k]
      }
      v.fromScale[i] = scatter ? 0 : v.scale[i]
      v.toScale[i] = shape.scales[i]
      v.fromAccent[i] = scatter ? 0 : v.toAccent[i]
      v.toAccent[i] = shape.accents[i]
      const height = (shape.positions[i * 3 + 1] + 4) / 8
      v.start[i] = now + (still ? -FLIGHT * 2 : height * STAGGER * 0.6 + rand() * STAGGER * 0.4)
    }
  }

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    if (!still) clock.current += dt
    const time = clock.current
    const v = voxels
    const want = still ? (posterShape as ShapeId) : getShape()
    if (want !== shown.current) {
      retarget(want, time, shown.current === null && !still)
      shown.current = want
    }
    const animated = (shapes.get(want) as ShapeData).animated

    // где стоит фигура: на широком экране справа от текста, на узком — над текстом первого экрана
    const project = !still && isProjectPage()
    const hero = still ? 1 : getHero()
    const p = place.current
    const wantX = narrow ? 0 : project ? -0.25 : -0.23 - 0.02 * hero
    const wantY = narrow ? (still ? 0 : 0.2) : 0.02
    const wantScale = narrow ? 0.5 : project ? 0.66 : 0.7 + 0.06 * hero
    const k = still || !p.started ? 1 : 1 - Math.exp(-3 * dt)
    p.x += (wantX - p.x) * k
    p.y += (wantY - p.y) * k
    p.scale += (wantScale - p.scale) * k
    p.started = true
    ;(camera as PerspectiveCamera).setViewOffset(size.width, size.height, size.width * p.x, size.height * p.y, size.width, size.height)
    camera.position.set(0, 1.2, 17)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()

    // покачивание вокруг удобного ракурса и лёгкий наклон за курсором
    const t = tilt.current
    const kTilt = still ? 1 : 1 - Math.exp(-2.5 * dt)
    t.x += ((pointer.current.on ? pointer.current.y * 0.18 : 0) - t.x) * kTilt
    t.y += ((pointer.current.on ? pointer.current.x * 0.35 : 0) - t.y) * kTilt
    const figure = scene.figure
    figure.rotation.set(0.32 + t.x, FACING + (still ? 0 : Math.sin(time * SWAY_SPEED) * SWAY) + t.y, 0)
    figure.scale.setScalar(p.scale)
    figure.updateMatrixWorld()

    // курсор на плоскости через центр фигуры, в координатах фигуры
    let pointerOn = false
    if (pointer.current.on && !still) {
      raycaster.setFromCamera(ndc.set(pointer.current.x, -pointer.current.y), camera)
      plane.setFromNormalAndCoplanarPoint(normal.set(0, 0, 1), figure.position)
      if (raycaster.ray.intersectPlane(plane, hit)) {
        inverse.copy(figure.matrixWorld).invert()
        local.copy(hit).applyMatrix4(inverse)
        pointerOn = true
      }
    }
    pulse.current += dt
    const ring = pulse.current * 9
    const kPush = 1 - Math.exp(-8 * dt)

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3
      const progress = still ? 1 : MathUtils.clamp((time - v.start[i]) / FLIGHT, 0, 1)
      const e = easeInOut(progress)
      const lift = Math.sin(Math.PI * e) * ARC
      let x = v.from[i3] + (v.to[i3] - v.from[i3]) * e + v.arc[i3] * lift
      let y = v.from[i3 + 1] + (v.to[i3 + 1] - v.from[i3 + 1]) * e + v.arc[i3 + 1] * lift
      let z = v.from[i3 + 2] + (v.to[i3 + 2] - v.from[i3 + 2]) * e + v.arc[i3 + 2] * lift
      // живая форма: поверхность графика бежит волной
      if (animated && progress >= 1) {
        y += Math.sin(x * 0.9 + time * 1.8) * Math.cos(z * 0.55 + time * 0.9) * 0.9 + (v.toAccent[i] ? 0.35 : 0)
      }
      // кубики дышат: еле заметное покачивание
      if (!still) y += Math.sin(time * 1.4 + v.phase[i]) * 0.035
      v.current[i3] = x
      v.current[i3 + 1] = y
      v.current[i3 + 2] = z

      // волна от события: кольцо расходится от центра и выталкивает кубики наружу
      const r = Math.hypot(x, y, z)
      const wave = pulse.current < 1.6 ? Math.max(0, 1 - Math.abs(r - ring) / 1.2) * (1 - pulse.current / 1.6) : 0
      let px = 0
      let py = 0
      let pz = 0
      if (pointerOn) {
        const dx = x - local.x
        const dy = y - local.y
        const d = Math.hypot(dx, dy)
        if (d < PUSH_RADIUS) {
          const f = ((1 - d / PUSH_RADIUS) ** 2 * PUSH) / Math.max(d, 0.001)
          px = dx * f
          py = dy * f
          pz = (1 - d / PUSH_RADIUS) * PUSH * 0.8
        }
      }
      v.push[i3] += (px - v.push[i3]) * kPush
      v.push[i3 + 1] += (py - v.push[i3 + 1]) * kPush
      v.push[i3 + 2] += (pz - v.push[i3 + 2]) * kPush
      const out = r > 0.001 ? (wave * 0.7) / r : 0
      x += v.push[i3] + x * out
      y += v.push[i3 + 1] + y * out
      z += v.push[i3 + 2] + z * out

      const s = v.fromScale[i] + (v.toScale[i] - v.fromScale[i]) * e
      v.scale[i] = s
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, 0, 0)
      if (progress < 1) dummy.rotation.set(lift * 0.6 + v.phase[i], lift * 0.4, 0)
      dummy.scale.setScalar(Math.max(0.0001, s * (1 + wave * 0.6)))
      dummy.updateMatrix()
      scene.mesh.setMatrixAt(i, dummy.matrix)
      const glow = Math.min(1, v.fromAccent[i] + (v.toAccent[i] - v.fromAccent[i]) * e + wave * 0.8)
      scene.mesh.setColorAt(i, color.copy(base).lerp(accent, glow))
    }
    scene.mesh.instanceMatrix.needsUpdate = true
    if (scene.mesh.instanceColor) scene.mesh.instanceColor.needsUpdate = true

    frames.current += 1
    if (frames.current === 3) onReady()
  })

  return <primitive object={scene.root} />
}
