import { PerspectiveCamera } from '@react-three/drei/core/PerspectiveCamera'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  Color,
  Group,
  InstancedMesh,
  MathUtils,
  MeshStandardMaterial,
  Object3D,
  Vector3,
  type PerspectiveCamera as PerspCamera,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { getFraming, POSTER_UNITS } from '../stage/framing'
import { getProgress, onProgress } from '../stage/store'
import { animate, CELL, COUNT, FORMATIONS, SCALES, VIEWS } from './formations'

const FOV = 26
const BONE = new Color('#f1eee6')
const ACCENT = new Color('#4a78ff')
const LAST = FORMATIONS.length - 1

/** Детерминированный «случайный» ряд: у каждого кубика своя задержка и дуга полёта. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

interface SceneProps {
  /** фиксированная глава для съёмки постеров */
  posterChapter: number | null
  shadows: boolean
  onReady: () => void
}

export function CubeScene({ posterChapter, shadows, onReady }: SceneProps) {
  const invalidate = useThree((s) => s.invalidate)
  const size = useThree((s) => s.size)

  const geometry = useMemo(() => new RoundedBoxGeometry(CELL * 0.9, CELL * 0.9, CELL * 0.9, 2, 0.035), [])
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.58, metalness: 0 }), [])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  const cubes = useMemo(() => {
    const random = seeded(42)
    return Array.from({ length: COUNT }, () => ({
      delay: random(),
      arc: new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize().multiplyScalar(0.5 + random() * 1.1),
      spin: new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).multiplyScalar(5),
      tint: 0.94 + random() * 0.06,
    }))
  }, [])

  const camera = useRef<PerspCamera>(null)
  const group = useRef<Group>(null)
  const mesh = useRef<InstancedMesh>(null)

  const motion = useRef({
    p: posterChapter ?? getProgress(),
    applied: -1,
    tiltX: 0,
    tiltY: 0,
    pointerX: 0,
    pointerY: 0,
    frames: 0,
    frame: '',
    /** смещения и скорости кубиков после толчка */
    push: new Float32Array(COUNT * 3),
    pushV: new Float32Array(COUNT * 3),
    pushed: false,
    local: new Float32Array(COUNT * 3),
  })

  useEffect(() => {
    invalidate()
  }, [invalidate, size])

  useEffect(() => {
    if (posterChapter !== null) return
    const offProgress = onProgress(() => invalidate())
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      motion.current.pointerX = (event.clientX / window.innerWidth) * 2 - 1
      motion.current.pointerY = (event.clientY / window.innerHeight) * 2 - 1
      invalidate()
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      offProgress()
      window.removeEventListener('pointermove', onPointer)
      document.body.style.cursor = ''
    }
  }, [invalidate, posterChapter])

  const tools = useMemo(
    () => ({
      dummy: new Object3D(),
      color: new Color(),
      a: [0, 0, 0] as [number, number, number],
      b: [0, 0, 0] as [number, number, number],
    }),
    [],
  )

  useFrame((state, delta) => {
    const s = motion.current
    const dt = Math.min(delta, 0.05)
    const goal = posterChapter ?? getProgress()
    s.p = Math.abs(goal - s.p) < 0.0004 ? goal : MathUtils.damp(s.p, goal, 6, dt)
    s.tiltX = MathUtils.damp(s.tiltX, s.pointerX, 4, dt)
    s.tiltY = MathUtils.damp(s.tiltY, s.pointerY, 4, dt)

    // толчок: пружина возвращает каждый кубик на место
    let energy = 0
    if (s.pushed) {
      for (let i = 0; i < COUNT * 3; i += 1) {
        s.pushV[i] += (-46 * s.push[i] - 5.5 * s.pushV[i]) * dt
        s.push[i] += s.pushV[i] * dt
        energy += Math.abs(s.push[i]) + Math.abs(s.pushV[i]) * 0.1
      }
      if (energy < 0.02) {
        s.push.fill(0)
        s.pushV.fill(0)
        s.pushed = false
      }
    }

    const instanced = mesh.current
    if (instanced && (s.applied !== s.p || s.pushed || energy > 0)) {
      s.applied = s.p
      const from = Math.min(LAST, Math.max(0, Math.floor(s.p)))
      const to = Math.min(LAST, from + 1)
      const t = MathUtils.clamp(s.p - from, 0, 1)
      const { dummy, color, a, b } = tools
      for (let i = 0; i < COUNT; i += 1) {
        const cube = cubes[i]
        const pa = FORMATIONS[from][i]
        const pb = FORMATIONS[to][i]
        animate(from, i, pa, s.p, a)
        animate(to, i, pb, s.p, b)
        // у каждого кубика своя задержка, поэтому форма рассыпается и собирается волной
        const e = MathUtils.smootherstep(MathUtils.clamp(t * 1.6 - cube.delay * 0.6, 0, 1), 0, 1)
        const lift = Math.sin(Math.PI * e)
        const x = a[0] + (b[0] - a[0]) * e + cube.arc.x * lift
        const y = a[1] + (b[1] - a[1]) * e + cube.arc.y * lift
        const z = a[2] + (b[2] - a[2]) * e + cube.arc.z * lift
        s.local[i * 3] = x
        s.local[i * 3 + 1] = y
        s.local[i * 3 + 2] = z
        dummy.position.set(x + s.push[i * 3], y + s.push[i * 3 + 1], z + s.push[i * 3 + 2])
        dummy.rotation.set(cube.spin.x * lift, cube.spin.y * lift, cube.spin.z * lift)
        dummy.updateMatrix()
        instanced.setMatrixAt(i, dummy.matrix)
        color.copy(BONE).multiplyScalar(cube.tint).lerp(ACCENT, pa[3] + (pb[3] - pa[3]) * e)
        instanced.setColorAt(i, color)
      }
      instanced.instanceMatrix.needsUpdate = true
      if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
      instanced.computeBoundingSphere()
    }

    // ракурс формы плюс лёгкий наклон за курсором
    if (group.current) {
      const from = Math.min(LAST, Math.max(0, Math.floor(s.p)))
      const to = Math.min(LAST, from + 1)
      const e = MathUtils.smootherstep(MathUtils.clamp(s.p - from, 0, 1), 0, 1)
      group.current.rotation.set(
        MathUtils.lerp(VIEWS[from][1], VIEWS[to][1], e) + s.tiltY * 0.1,
        MathUtils.lerp(VIEWS[from][0], VIEWS[to][0], e) + s.tiltX * 0.22,
        0,
        'XYZ',
      )
      group.current.scale.setScalar(MathUtils.lerp(SCALES[from], SCALES[to], e))
    }

    const cam = camera.current
    if (cam) {
      const { width, height } = state.size
      const frame =
        posterChapter !== null
          ? { zoom: width / POSTER_UNITS, anchorX: width / 2, anchorY: height / 2 }
          : getFraming(width, height, s.p)
      const key = `${width}:${height}:${frame.zoom.toFixed(3)}:${frame.anchorX.toFixed(1)}:${frame.anchorY.toFixed(1)}`
      if (key !== s.frame) {
        s.frame = key
        cam.position.set(0, 0, height / (2 * frame.zoom * Math.tan(MathUtils.degToRad(FOV / 2))))
        cam.setViewOffset(width, height, width / 2 - frame.anchorX, height / 2 - frame.anchorY, width, height)
      }
    }

    const moving =
      s.p !== goal || s.pushed || Math.abs(s.tiltX - s.pointerX) > 0.002 || Math.abs(s.tiltY - s.pointerY) > 0.002
    if (moving) state.invalidate()

    s.frames += 1
    if (s.frames === 2) onReady()
    else if (s.frames < 2) state.invalidate()
  })

  const isCovered = (event: ThreeEvent<PointerEvent>) =>
    Boolean((event.nativeEvent.target as Element | null)?.closest?.('[data-solid]'))

  const push = (event: ThreeEvent<PointerEvent>) => {
    if (isCovered(event) || !group.current) return
    event.stopPropagation()
    const s = motion.current
    const hit = group.current.worldToLocal(event.point.clone())
    for (let i = 0; i < COUNT; i += 1) {
      const dx = s.local[i * 3] - hit.x
      const dy = s.local[i * 3 + 1] - hit.y
      const dz = s.local[i * 3 + 2] - hit.z
      const distance = Math.hypot(dx, dy, dz) + 0.25
      const force = (7 * Math.exp(-distance * 0.55)) / distance
      s.pushV[i * 3] += dx * force
      s.pushV[i * 3 + 1] += dy * force
      s.pushV[i * 3 + 2] += dz * force
    }
    s.pushed = true
    invalidate()
  }

  const hover = (over: boolean) => (event: ThreeEvent<PointerEvent>) => {
    document.body.style.cursor = over && !isCovered(event) ? 'pointer' : ''
  }

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault fov={FOV} near={1} far={200} position={[0, 0, 30]} />
      <hemisphereLight args={['#ffffff', '#1c2029', 0.95]} />
      <directionalLight
        position={[4, 7, 9]}
        intensity={3.1}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      >
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 1, 30]} />
      </directionalLight>
      <directionalLight position={[-6, 2, -4]} intensity={0.5} color="#9db4ff" />
      <group ref={group}>
        <instancedMesh
          ref={mesh}
          args={[geometry, material, COUNT]}
          castShadow={shadows}
          receiveShadow={shadows}
          frustumCulled={false}
          onPointerDown={push}
          onPointerOver={hover(true)}
          onPointerOut={hover(false)}
        />
      </group>
    </>
  )
}
