import { BoxGeometry, BufferAttribute, BufferGeometry, Color, CylinderGeometry, EdgesGeometry, Euler, Matrix4, Quaternion, Vector3 } from 'three'

/** Палитра сцены: бумага, тушь, крафт и один сигнальный цвет. */
export const TONE = {
  white: '#f6f1e6',
  mid: '#d9d0bd',
  dark: '#2b2924',
  ink: '#15140f',
  kraft: '#d0aa78',
  signal: '#ff4f00',
} as const

export type Vec3 = [number, number, number]

/** Примитив: коробка или цилиндр. Позиция — центр основания (низ), так проще ставить на пол. */
export interface Spec {
  kind?: 'box' | 'cyl'
  at: Vec3
  /** коробка: ширина, высота, глубина; цилиндр: радиус, высота, число граней */
  size: Vec3
  color: string
  rot?: Vec3
}

const matrix = new Matrix4()
const quaternion = new Quaternion()
const euler = new Euler()
const normal = new Vector3()
const one = new Vector3(1, 1, 1)

/** Запекает свет в цвет вершин: верх светлый, левая грань в полутени, правая в тени. */
function shade(geometry: BufferGeometry, hex: string): void {
  const base = new Color(hex)
  const normals = geometry.getAttribute('normal')
  const colors = new Float32Array(normals.count * 3)
  for (let i = 0; i < normals.count; i += 1) {
    normal.fromBufferAttribute(normals, i)
    const light = Math.min(
      1,
      0.4 + 0.6 * Math.max(0, normal.y) + 0.3 * Math.max(0, normal.z) + 0.06 * Math.max(0, normal.x),
    )
    colors[i * 3] = base.r * light
    colors[i * 3 + 1] = base.g * light
    colors[i * 3 + 2] = base.b * light
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
}

function primitive(spec: Spec): BufferGeometry {
  const [a, b, c] = spec.size
  const raw = spec.kind === 'cyl' ? new CylinderGeometry(a, a, b, c) : new BoxGeometry(a, b, c)
  const geometry = raw.toNonIndexed()
  raw.dispose()
  geometry.translate(0, b / 2, 0)
  // сначала наклон вокруг своей оси X, потом разворот вокруг вертикали
  if (spec.rot) euler.set(spec.rot[0], spec.rot[1], spec.rot[2], 'YXZ')
  else euler.set(0, 0, 0, 'YXZ')
  matrix.compose(new Vector3(...spec.at), quaternion.setFromEuler(euler), one)
  geometry.applyMatrix4(matrix)
  shade(geometry, spec.color)
  return geometry
}

function concat(chunks: Float32Array[]): Float32Array {
  const out = new Float32Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

export interface Built {
  solid: BufferGeometry
  edges: BufferGeometry
}

/** Склеивает примитивы в одну геометрию граней и одну геометрию рёбер: два draw call на всё. */
export function build(specs: Spec[]): Built {
  const positions: Float32Array[] = []
  const colors: Float32Array[] = []
  const lines: Float32Array[] = []
  for (const spec of specs) {
    const geometry = primitive(spec)
    positions.push(geometry.getAttribute('position').array as Float32Array)
    colors.push(geometry.getAttribute('color').array as Float32Array)
    const edges = new EdgesGeometry(geometry, 28)
    lines.push(edges.getAttribute('position').array as Float32Array)
    edges.dispose()
    geometry.dispose()
  }
  const solid = new BufferGeometry()
  solid.setAttribute('position', new BufferAttribute(concat(positions), 3))
  solid.setAttribute('color', new BufferAttribute(concat(colors), 3))
  const edges = new BufferGeometry()
  edges.setAttribute('position', new BufferAttribute(concat(lines), 3))
  return { solid, edges }
}

/** Направление света для плоских теней на полу. */
const SUN = { x: 0.62, z: -0.42 }

/** Матрица, которая кладёт геометрию тенью на пол вдоль направления света. */
export const shadowMatrix = new Matrix4().set(1, SUN.x, 0, 0, 0, 0, 0, 0.015, 0, SUN.z, 1, 0, 0, 0, 0, 1)
