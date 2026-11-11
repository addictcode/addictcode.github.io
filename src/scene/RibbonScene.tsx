import { PerspectiveCamera } from '@react-three/drei/core/PerspectiveCamera'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  ShaderMaterial,
  Vector3,
  type PerspectiveCamera as PerspCamera,
  type Texture,
} from 'three'
import { getProgress, onProgress } from '../stage/store'
import { themeAt, type Rgb } from '../stage/theme'
import { KNOTS, knotPoint, SEGMENTS } from './curves'
import { textMask, whenDisplayFontReady } from './textures'

const FOV = 30
const LAST = KNOTS.length - 1
const POINTS = SEGMENTS + 1

/** Три ленты: широкая с услугами, средняя со стеком и тонкая без надписи. */
const RIBBONS = [
  { width: 1.7, shift: 0, gain: 1, speed: 0.55, text: 'main' as const },
  { width: 1.0, shift: 2.1, gain: 1.18, speed: -0.9, text: 'stack' as const },
  { width: 0.22, shift: 4.2, gain: 1.34, speed: 0, text: null },
]

const ribbonVertex = /* glsl */ `
  attribute float along;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = vec2(along, uv.y);
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ribbonFragment = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 band;
  uniform vec3 ink;
  uniform float offset;
  uniform float hasText;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    float mask = hasText * texture2D(map, vec2(vUv.x + offset, vUv.y * 1.16 - 0.08)).a;
    // кант по краям, как у киноплёнки
    float edge = hasText * step(0.44, abs(vUv.y - 0.5));
    vec3 color = mix(band, ink, max(mask, edge));
    float light = 0.7 + 0.3 * abs(dot(normalize(vNormal), normalize(vec3(0.3, 0.5, 0.8))));
    gl_FragColor = vec4(color * light * (gl_FrontFacing ? 1.0 : 0.86), 1.0);
  }
`

/** Точки на фоне: растр, по которому от скролла идёт волна, а курсор его раздувает. */
const dotsFragment = /* glsl */ `
  uniform vec3 ink;
  uniform vec2 pointer;
  uniform float progress;
  uniform float cell;
  void main() {
    vec2 grid = gl_FragCoord.xy / cell;
    vec2 id = floor(grid);
    vec2 local = fract(grid) - 0.5;
    float wave = 0.5 + 0.5 * sin(id.x * 0.21 + id.y * 0.13 + progress * 3.6) * cos(id.y * 0.17 - progress * 2.2);
    float near = exp(-length(gl_FragCoord.xy - pointer) / (cell * 9.0));
    float radius = 0.06 + 0.3 * wave * wave + 0.22 * near;
    float dot = 1.0 - smoothstep(radius - 0.06, radius + 0.06, length(local));
    gl_FragColor = vec4(ink, dot * 0.2);
  }
`

const toUniform = (rgb: Rgb, target: Vector3) => target.set(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)

interface SceneProps {
  texts: { main: string; stack: string }
  /** фиксированная глава для съёмки постеров */
  posterChapter: number | null
  onReady: () => void
}

export function RibbonScene({ texts, posterChapter, onReady }: SceneProps) {
  const invalidate = useThree((s) => s.invalidate)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const [fontTick, setFontTick] = useState(0)

  const masks = useMemo(
    () => ({ main: textMask(texts.main), stack: textMask(texts.stack) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texts.main, texts.stack, fontTick],
  )
  useEffect(
    () => () => {
      masks.main.texture.dispose()
      masks.stack.texture.dispose()
    },
    [masks],
  )

  const ribbons = useMemo(
    () =>
      RIBBONS.map(() => {
        const geometry = new BufferGeometry()
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(POINTS * 6), 3))
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(POINTS * 6), 3))
        geometry.setAttribute('along', new BufferAttribute(new Float32Array(POINTS * 2), 1))
        const uv = new Float32Array(POINTS * 4)
        const index: number[] = []
        for (let i = 0; i < POINTS; i += 1) {
          uv[i * 4 + 1] = 0
          uv[i * 4 + 3] = 1
          if (i < SEGMENTS) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
        }
        geometry.setAttribute('uv', new BufferAttribute(uv, 2))
        geometry.setIndex(index)
        const material = new ShaderMaterial({
          vertexShader: ribbonVertex,
          fragmentShader: ribbonFragment,
          side: DoubleSide,
          uniforms: {
            map: { value: null as Texture | null },
            band: { value: new Vector3() },
            ink: { value: new Vector3() },
            offset: { value: 0 },
            hasText: { value: 0 },
          },
        })
        return { geometry, material }
      }),
    [],
  )
  const dots = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.999, 1.0); }',
        fragmentShader: dotsFragment,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: { ink: { value: new Vector3() }, pointer: { value: new Vector3() }, progress: { value: 0 }, cell: { value: 26 } },
      }),
    [],
  )
  useEffect(
    () => () => {
      ribbons.forEach((r) => {
        r.geometry.dispose()
        r.material.dispose()
      })
      dots.dispose()
    },
    [ribbons, dots],
  )

  const camera = useRef<PerspCamera>(null)
  const group = useRef<Group>(null)
  const meshes = useRef<(Mesh | null)[]>([])
  const motion = useRef({
    p: posterChapter ?? getProgress(),
    drawn: '',
    tiltX: 0,
    tiltY: 0,
    pointerX: 0,
    pointerY: 0,
    clientX: -9999,
    clientY: -9999,
    kick: 0,
    kickV: 0,
    frames: 0,
  })

  useEffect(() => {
    let alive = true
    whenDisplayFontReady(texts.main).then(() => alive && setFontTick((n) => n + 1))
    return () => {
      alive = false
    }
  }, [texts.main])

  useEffect(() => {
    motion.current.drawn = ''
    invalidate()
  }, [invalidate, size, masks])

  useEffect(() => {
    if (posterChapter !== null) return
    const offProgress = onProgress(() => invalidate())
    const onMove = (event: PointerEvent) => {
      const s = motion.current
      s.clientX = event.clientX
      s.clientY = event.clientY
      if (event.pointerType === 'mouse') {
        s.pointerX = (event.clientX / window.innerWidth) * 2 - 1
        s.pointerY = (event.clientY / window.innerHeight) * 2 - 1
      }
      invalidate()
    }
    // клик мимо текста встряхивает ленты
    const onDown = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest?.('[data-solid]')) return
      motion.current.kickV += 9
      invalidate()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      offProgress()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [invalidate, posterChapter])

  const tools = useMemo(
    () => ({
      a: [0, 0, 0] as [number, number, number],
      b: [0, 0, 0] as [number, number, number],
      centers: new Float32Array(POINTS * 3),
      tangent: new Vector3(),
      side: new Vector3(),
      normal: new Vector3(),
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
    s.kickV += (-60 * s.kick - 5 * s.kickV) * dt
    s.kick += s.kickV * dt
    if (Math.abs(s.kick) < 0.001 && Math.abs(s.kickV) < 0.01) {
      s.kick = 0
      s.kickV = 0
    }

    const { width, height } = state.size
    const portrait = width < height
    const key = `${s.p.toFixed(4)}:${s.kick.toFixed(4)}:${width}:${height}`
    if (key !== s.drawn) {
      s.drawn = key
      const from = Math.min(LAST, Math.max(0, Math.floor(s.p)))
      const to = Math.min(LAST, from + 1)
      const e = MathUtils.smootherstep(MathUtils.clamp(s.p - from, 0, 1), 0, 1)
      const twist = MathUtils.lerp(KNOTS[from].twist, KNOTS[to].twist, e) + s.kick * 0.6
      const theme = themeAt(s.p)
      const { a, b, centers, tangent, side, normal } = tools

      RIBBONS.forEach((config, r) => {
        const { geometry, material } = ribbons[r]
        const gain = config.gain * (1 + s.kick * 0.22)
        for (let i = 0; i < POINTS; i += 1) {
          const t = (i / SEGMENTS) * 2 - 1
          knotPoint(KNOTS[from], t, config.shift, gain, a)
          knotPoint(KNOTS[to], t, config.shift, gain, b)
          centers[i * 3] = a[0] + (b[0] - a[0]) * e
          centers[i * 3 + 1] = a[1] + (b[1] - a[1]) * e
          centers[i * 3 + 2] = a[2] + (b[2] - a[2]) * e
        }
        const position = geometry.getAttribute('position') as BufferAttribute
        const normals = geometry.getAttribute('normal') as BufferAttribute
        const along = geometry.getAttribute('along') as BufferAttribute
        const mask = config.text ? masks[config.text] : null
        const half = config.width / 2
        let length = 0
        // «боковой» вектор переносится вдоль кривой без рывков и доворачивается на твист
        side.set(0, 1, 0)
        for (let i = 0; i < POINTS; i += 1) {
          const prev = Math.max(0, i - 1) * 3
          const next = Math.min(SEGMENTS, i + 1) * 3
          tangent.set(centers[next] - centers[prev], centers[next + 1] - centers[prev + 1], centers[next + 2] - centers[prev + 2]).normalize()
          side.addScaledVector(tangent, -side.dot(tangent)).normalize()
          const angle = twist * Math.PI * ((i / SEGMENTS) * 2 - 1) * Math.exp(-Math.pow(Math.abs((i / SEGMENTS) * 2 - 1) / 0.6, 4))
          normal.copy(side).applyAxisAngle(tangent, angle)
          const x = centers[i * 3]
          const y = centers[i * 3 + 1]
          const z = centers[i * 3 + 2]
          if (i > 0) length += Math.hypot(x - centers[i * 3 - 3], y - centers[i * 3 - 2], z - centers[i * 3 - 1])
          position.setXYZ(i * 2, x - normal.x * half, y - normal.y * half, z - normal.z * half)
          position.setXYZ(i * 2 + 1, x + normal.x * half, y + normal.y * half, z + normal.z * half)
          const u = mask ? length / (config.width * mask.aspect) : 0
          along.setX(i * 2, u)
          along.setX(i * 2 + 1, u)
          normal.crossVectors(tangent, normal)
          normals.setXYZ(i * 2, normal.x, normal.y, normal.z)
          normals.setXYZ(i * 2 + 1, normal.x, normal.y, normal.z)
        }
        position.needsUpdate = true
        normals.needsUpdate = true
        along.needsUpdate = true

        const u = material.uniforms
        u.map.value = mask ? mask.texture : null
        u.hasText.value = mask ? 1 : 0
        u.offset.value = s.p * config.speed
        // широкая лента — цветом текста, средняя — акцентом, тонкая — цветом текста
        toUniform(r === 1 ? theme.accent : theme.ink, u.band.value)
        toUniform(r === 1 ? theme.accentInk : theme.bg, u.ink.value)
      })

      toUniform(theme.ink, dots.uniforms.ink.value)
      dots.uniforms.progress.value = s.p
      dots.uniforms.cell.value = (portrait ? 20 : 26) * dpr
    }
    dots.uniforms.pointer.value.set(s.clientX * dpr, (height - s.clientY) * dpr, 0)

    if (group.current) {
      const scale = portrait ? Math.max(0.5, (width / height) * 1.25) : 1
      group.current.scale.setScalar(scale)
      group.current.position.set(portrait ? 0 : 1.2, portrait ? 1.2 : 0, 0)
      group.current.rotation.set(s.tiltY * 0.12 + s.kick * 0.05, s.tiltX * 0.2 + Math.sin(s.p * 1.3) * 0.25, portrait ? -0.5 : 0)
    }

    const moving =
      s.p !== goal || s.kick !== 0 || Math.abs(s.tiltX - s.pointerX) > 0.002 || Math.abs(s.tiltY - s.pointerY) > 0.002
    if (moving) state.invalidate()

    s.frames += 1
    if (s.frames === 2) onReady()
    else if (s.frames < 2) state.invalidate()
  })

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault fov={FOV} near={1} far={200} position={[0, 0, 24]} />
      <mesh material={dots} frustumCulled={false} renderOrder={-1}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      <group ref={group}>
        {ribbons.map((ribbon, i) => (
          <mesh
            key={i}
            ref={(node) => {
              meshes.current[i] = node
            }}
            geometry={ribbon.geometry}
            material={ribbon.material}
            frustumCulled={false}
          />
        ))}
      </group>
    </>
  )
}
