import { BoxGeometry, BufferGeometry, EdgesGeometry, Float32BufferAttribute } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Детерминированный генератор: горизонт одинаковый между запусками и на кадрах статичной версии. */
function random(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const COUNT = 260
/** карта занимает этот прямоугольник: стойки ставятся только вокруг него */
const CLEAR_X = 34
const CLEAR_Z = 28

/**
 * «Серверный город» на горизонте: низкие стойки разной высоты кольцом вокруг карты.
 * Чем дальше стойка, тем она выше, поэтому силуэт поднимается к горизонту. Одна геометрия граней и одна рёбер.
 */
export function horizonGeometry(): { solid: BufferGeometry; edges: BufferGeometry } {
  const rand = random(7)
  const solids: BufferGeometry[] = []
  const edges: number[] = []
  let placed = 0
  while (placed < COUNT) {
    const x = (rand() - 0.5) * 240
    const z = (rand() - 0.5) * 200
    if (Math.abs(x) < CLEAR_X && Math.abs(z) < CLEAR_Z) continue
    placed += 1
    const far = Math.min(1, Math.hypot(x, z) / 110)
    const w = 1.5 + rand() * 3.5
    const d = 1.5 + rand() * 3.5
    const h = 0.6 + rand() * (2 + far * 10)
    const box = new BoxGeometry(w, h, d).translate(x, h / 2, z)
    solids.push(box)
    const lines = new EdgesGeometry(box)
    edges.push(...(lines.getAttribute('position').array as Float32Array))
    lines.dispose()
  }
  const solid = mergeGeometries(solids)
  solids.forEach((part) => part.dispose())
  const edgeGeometry = new BufferGeometry()
  edgeGeometry.setAttribute('position', new Float32BufferAttribute(edges, 3))
  return { solid, edges: edgeGeometry }
}
