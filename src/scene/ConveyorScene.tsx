import { OrthographicCamera } from '@react-three/drei/core/OrthographicCamera'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DoubleSide,
  Group,
  InstancedMesh,
  KeepStencilOp,
  LineBasicMaterial,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  NotEqualStencilFunc,
  Object3D,
  ReplaceStencilOp,
  Vector3,
  type OrthographicCamera as OrthoCamera,
} from 'three'
import { getFraming, POSTER_UNITS, STATION_SPACING } from '../stage/framing'
import { getProgress, onProgress } from '../stage/store'
import { build, shadowMatrix, TONE, type Built } from './geometry'
import { BELT_END, BELT_START, BELT_Y, createLine, STATIONS } from './stations'
import { labelTexture, signTexture, stampTexture, whenDisplayFontReady } from './textures'

const PARCEL = { w: 1.7, h: 1.15, d: 1.3 }
const DASH_GAP = 0.7
const PARCEL_SCALE = 1.2
const DASH_COUNT = Math.ceil((BELT_END - BELT_START) / DASH_GAP)
const ISO = new Vector3(1, 0.86, 1).normalize()
const TARGET_Y = 1.7

/** Места штампов на посылке: позиция, поворот вокруг Y (грань) и наклон самого штампа. */
const STAMP_SLOTS: { at: [number, number, number]; face: 'z' | 'x' | 'top'; tilt: number; size: number }[] = [
  { at: [-0.42, 0.82, 0], face: 'z', tilt: -0.1, size: 0.72 },
  { at: [0.42, 0.8, 0], face: 'z', tilt: 0.07, size: 0.72 },
  { at: [-0.4, 0.3, 0], face: 'z', tilt: 0.05, size: 0.72 },
  { at: [0.44, 0.32, 0], face: 'z', tilt: -0.08, size: 0.72 },
  { at: [0, 0.84, -0.3], face: 'x', tilt: 0.06, size: 0.6 },
  { at: [0, 0.82, 0.32], face: 'x', tilt: -0.09, size: 0.6 },
  { at: [0, 0.3, 0.02], face: 'x', tilt: 0.04, size: 0.7 },
  { at: [0.2, 0, 0.36], face: 'top', tilt: 0.07, size: 1.1 },
]

const solidMaterial = new MeshBasicMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
const lineMaterial = new LineBasicMaterial({ color: TONE.ink })
const shadowMaterial = new MeshBasicMaterial({
  color: TONE.ink,
  transparent: true,
  opacity: 0.13,
  depthWrite: false,
  side: DoubleSide,
  stencilWrite: true,
  stencilRef: 1,
  stencilFunc: NotEqualStencilFunc,
  stencilFail: KeepStencilOp,
  stencilZFail: KeepStencilOp,
  stencilZPass: ReplaceStencilOp,
})

function Part({ built }: { built: Built }) {
  return (
    <>
      <mesh geometry={built.solid} material={solidMaterial} />
      <lineSegments geometry={built.edges} material={lineMaterial} />
    </>
  )
}

interface SceneProps {
  stamps: string[]
  /** фиксированная станция для съёмки постеров */
  posterStation: number | null
  onReady: () => void
}

export function ConveyorScene({ stamps, posterStation, onReady }: SceneProps) {
  const invalidate = useThree((s) => s.invalidate)
  const size = useThree((s) => s.size)
  const [fontTick, setFontTick] = useState(0)

  const line = useMemo(createLine, [])
  const staticBuilt = useMemo(() => build(line.specs), [line])
  const moverBuilt = useMemo(() => line.movers.map((m) => build(m.specs)), [line])
  const parcelBuilt = useMemo(
    () =>
      build([
        { at: [0, 0, 0], size: [PARCEL.w, PARCEL.h, PARCEL.d], color: TONE.kraft },
        { at: [0, PARCEL.h, 0], size: [PARCEL.w + 0.01, 0.012, 0.26], color: TONE.mid },
      ]),
    [],
  )
  const dashBuilt = useMemo(() => build([{ at: [0, 0, 0], size: [0.09, 0.012, 2.1], color: '#55514a' }]), [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const label = useMemo(labelTexture, [fontTick])
  const signs = useMemo(
    () => Array.from({ length: STATIONS }, (_, i) => signTexture(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fontTick],
  )
  const stampMaps = useMemo(
    () => stamps.map((text, i) => stampTexture(text, i === STATIONS - 1 ? TONE.signal : TONE.ink)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stamps, fontTick],
  )
  useEffect(() => () => stampMaps.forEach((t) => t.dispose()), [stampMaps])
  useEffect(() => () => signs.forEach((t) => t.dispose()), [signs])
  useEffect(() => () => label.dispose(), [label])

  const camera = useRef<OrthoCamera>(null)
  const parcel = useRef<Group>(null)
  const parcelShadow = useRef<Mesh>(null)
  const dashes = useRef<InstancedMesh>(null)
  const moverRefs = useRef<(Group | null)[]>([])
  const stampRefs = useRef<(Mesh | null)[]>([])

  const motion = useRef({
    p: posterStation ?? getProgress(),
    applied: -1,
    tiltX: 0,
    tiltY: 0,
    pointerX: 0,
    pointerY: 0,
    hop: 0,
    hopV: 0,
    spin: 0,
    spinV: 0,
    frames: 0,
  })

  useEffect(() => {
    let alive = true
    whenDisplayFontReady().then(() => alive && setFontTick((n) => n + 1))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    invalidate()
  }, [invalidate, stampMaps, signs, label, size])

  useEffect(() => {
    if (posterStation !== null) return
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
  }, [invalidate, posterStation])

  const helpers = useMemo(
    () => ({ dummy: new Object3D(), target: new Vector3(), dir: new Vector3(), right: new Vector3(), up: new Vector3(), m: new Matrix4() }),
    [],
  )

  useFrame((state, delta) => {
    const s = motion.current
    const dt = Math.min(delta, 0.05)
    const goal = posterStation ?? getProgress()
    s.p = Math.abs(goal - s.p) < 0.0004 ? goal : MathUtils.damp(s.p, goal, 7, dt)
    s.tiltX = MathUtils.damp(s.tiltX, s.pointerX, 5, dt)
    s.tiltY = MathUtils.damp(s.tiltY, s.pointerY, 5, dt)

    // толчок посылки: подскок с гравитацией и затухающий поворот
    if (s.hop > 0 || s.hopV !== 0) {
      s.hopV -= 22 * dt
      s.hop += s.hopV * dt
      if (s.hop <= 0) {
        s.hop = 0
        s.hopV = s.hopV < -2.4 ? -s.hopV * 0.32 : 0
      }
    }
    s.spinV += (-70 * s.spin - 7 * s.spinV) * dt
    s.spin += s.spinV * dt
    if (Math.abs(s.spin) < 0.001 && Math.abs(s.spinV) < 0.01) {
      s.spin = 0
      s.spinV = 0
    }

    const parcelX = s.p * STATION_SPACING
    if (parcel.current) {
      parcel.current.position.set(parcelX, BELT_Y + s.hop, 0)
      parcel.current.rotation.y = s.spin
      parcel.current.scale.setScalar(PARCEL_SCALE)
      parcel.current.updateMatrix()
      if (parcelShadow.current) {
        parcelShadow.current.matrix.multiplyMatrices(shadowMatrix, parcel.current.matrix)
      }
    }

    if (s.applied !== s.p) {
      s.applied = s.p
      line.movers.forEach((mover, i) => {
        const object = moverRefs.current[i]
        if (object) mover.apply(object, MathUtils.clamp(s.p - mover.station + 1, 0, 1), s.p)
      })
      stampRefs.current.forEach((mesh, i) => {
        if (mesh) mesh.visible = s.p >= i - 0.04
      })
      if (dashes.current) {
        const offset = parcelX % DASH_GAP
        for (let i = 0; i < DASH_COUNT; i += 1) {
          const x = BELT_START + i * DASH_GAP + offset
          helpers.dummy.position.set(Math.min(x, BELT_END - 0.1), BELT_Y, 0)
          helpers.dummy.updateMatrix()
          dashes.current.setMatrixAt(i, helpers.dummy.matrix)
        }
        dashes.current.instanceMatrix.needsUpdate = true
      }
    }

    // камера: изометрия, посылка в «якоре» кадра, курсор слегка наклоняет вид
    const cam = camera.current
    if (cam) {
      const poster = posterStation !== null
      const frame = poster
        ? { zoom: state.size.width / POSTER_UNITS, anchorX: state.size.width / 2, anchorY: state.size.height / 2 }
        : getFraming(state.size.width, state.size.height, s.p)
      helpers.target.set(parcelX, TARGET_Y, 0)
      helpers.dir.copy(ISO).applyAxisAngle(Object3D.DEFAULT_UP, s.tiltX * 0.07)
      helpers.dir.y += s.tiltY * 0.05
      cam.position.copy(helpers.target).addScaledVector(helpers.dir.normalize(), 80)
      cam.lookAt(helpers.target)
      cam.updateMatrix()
      helpers.right.setFromMatrixColumn(cam.matrix, 0)
      helpers.up.setFromMatrixColumn(cam.matrix, 1)
      cam.position
        .addScaledVector(helpers.right, -(frame.anchorX - state.size.width / 2) / frame.zoom)
        .addScaledVector(helpers.up, (frame.anchorY - state.size.height / 2) / frame.zoom)
      if (cam.zoom !== frame.zoom) {
        cam.zoom = frame.zoom
        cam.updateProjectionMatrix()
      }
    }

    const moving =
      s.p !== goal ||
      s.hop > 0 ||
      s.spin !== 0 ||
      Math.abs(s.tiltX - s.pointerX) > 0.002 ||
      Math.abs(s.tiltY - s.pointerY) > 0.002
    if (moving) state.invalidate()

    s.frames += 1
    if (s.frames === 2) onReady()
    else if (s.frames < 2) state.invalidate()
  })

  const push = (event: ThreeEvent<PointerEvent>) => {
    const target = event.nativeEvent.target as Element | null
    if (target?.closest?.('[data-solid]')) return
    event.stopPropagation()
    const s = motion.current
    if (s.hop > 0.05) return
    s.hopV = 5.2
    s.hop = 0.001
    s.spinV += (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 2.5)
    invalidate()
  }

  const hover = (over: boolean) => (event: ThreeEvent<PointerEvent>) => {
    const target = event.nativeEvent.target as Element | null
    document.body.style.cursor = over && !target?.closest?.('[data-solid]') ? 'grab' : ''
  }

  return (
    <>
      <OrthographicCamera ref={camera} makeDefault near={1} far={400} position={[80, 80, 80]} />

      <Part built={staticBuilt} />
      <mesh geometry={staticBuilt.solid} material={shadowMaterial} matrix={shadowMatrix} matrixAutoUpdate={false} renderOrder={2} />

      <instancedMesh ref={dashes} args={[dashBuilt.solid, solidMaterial, DASH_COUNT]} frustumCulled={false} />

      {line.movers.map((mover, i) => (
        <group key={i} position-x={mover.station * STATION_SPACING}>
          <group
            ref={(node) => {
              moverRefs.current[i] = node
            }}
            position={mover.at}
          >
            <Part built={moverBuilt[i]} />
          </group>
        </group>
      ))}

      {signs.map((map, i) => (
        <mesh key={i} position={[i * STATION_SPACING - 2.6, 1.9, 2.36]}>
          <planeGeometry args={[1.5, 1.0]} />
          <meshBasicMaterial map={map} />
        </mesh>
      ))}

      <group ref={parcel} matrixAutoUpdate={false} onPointerDown={push} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        <Part built={parcelBuilt} />
        <mesh position={[-0.36, PARCEL.h + 0.02, -0.28]} rotation={[-Math.PI / 2, 0, 0.04]}>
          <planeGeometry args={[0.9, 0.6]} />
          <meshBasicMaterial map={label} />
        </mesh>
        {STAMP_SLOTS.map((slot, i) => {
          const position: [number, number, number] =
            slot.face === 'z'
              ? [slot.at[0], slot.at[1], PARCEL.d / 2 + 0.006]
              : slot.face === 'x'
                ? [PARCEL.w / 2 + 0.006, slot.at[1], slot.at[2]]
                : [slot.at[0], PARCEL.h + 0.03, slot.at[2]]
          const rotation: [number, number, number] =
            slot.face === 'z' ? [0, 0, slot.tilt] : slot.face === 'x' ? [slot.tilt, Math.PI / 2, 0] : [-Math.PI / 2, 0, slot.tilt]
          return (
            <mesh
              key={i}
              ref={(node) => {
                stampRefs.current[i] = node
              }}
              position={position}
              rotation={rotation}
              visible={false}
            >
              <planeGeometry args={[slot.size, slot.size / 2]} />
              <meshBasicMaterial map={stampMaps[i]} transparent depthWrite={false} />
            </mesh>
          )
        })}
      </group>
      <mesh ref={parcelShadow} geometry={parcelBuilt.solid} material={shadowMaterial} matrixAutoUpdate={false} frustumCulled={false} renderOrder={2} />
    </>
  )
}
