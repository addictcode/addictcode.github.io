import type { ShapeId } from '../system/graph'

/**
 * Формы скульптуры. Каждая — набор кубиков на сетке с шагом STEP,
 * собранный процедурно: моделей и файлов нет. Фигура умещается в шар радиусом ~4.
 */
export const STEP = 0.3

/** Кубик формы: положение и акцентный ли он. */
type Voxel = [x: number, y: number, z: number, accent: number]

/** Готовая форма на ровно `count` кубиков: позиции, масштабы и акценты. */
export interface ShapeData {
  positions: Float32Array
  scales: Float32Array
  accents: Float32Array
  /** форма живая: кубики двигаются в кадре (волна графика) */
  animated: boolean
}

/** Детерминированный генератор: формы совпадают между запусками и на кадрах статичной версии. */
export function random(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const range = (from: number, to: number): number[] => {
  const out: number[] = []
  for (let v = from; v <= to + 1e-6; v += STEP) out.push(Math.round(v / STEP) * STEP)
  return out
}

/** Прямоугольный брусок кубиков: от угла (x, y, z), размеры в метрах. */
function block(x: number, y: number, z: number, w: number, h: number, d: number, accent = 0): Voxel[] {
  const out: Voxel[] = []
  for (const vx of range(x, x + w - STEP)) for (const vy of range(y, y + h - STEP)) for (const vz of range(z, z + d - STEP)) out.push([vx, vy, vz, accent])
  return out
}

/** Брусок с центром в (x, ·, z). */
const centered = (x: number, y: number, z: number, w: number, h: number, d: number, accent = 0) => block(x - w / 2, y, z - d / 2, w, h, d, accent)

function core(): Voxel[] {
  // шар-оболочка с вырезанной восьмушкой, внутри оранжевое ядро
  const out: Voxel[] = []
  const radius = 3.4
  for (const x of range(-radius, radius))
    for (const y of range(-radius, radius))
      for (const z of range(-radius, radius)) {
        const d = Math.hypot(x, y, z)
        const cut = x > 0 && y > 0 && z > 0
        if (Math.abs(d - radius) < STEP * 0.55 && !cut) out.push([x, y, z, 0])
      }
  out.push(...centered(0, -0.9, 0, 1.8, 1.8, 1.8, 1))
  return out
}

function services(): Voxel[] {
  // девять площадок 3×3, на каждой столбики своей высоты: девять услуг
  const heights = [3, 5, 2, 6, 8, 4, 2, 5, 3]
  const out: Voxel[] = []
  heights.forEach((h, i) => {
    const cx = ((i % 3) - 1) * 2.7
    const cz = (Math.floor(i / 3) - 1) * 2.7
    out.push(...centered(cx, -2.4, cz, 2.1, STEP, 2.1))
    out.push(...centered(cx, -2.1, cz, 0.9, h * STEP, 0.9, i === 4 ? 1 : 0))
  })
  return out
}

function site(): Voxel[] {
  // окно браузера: рамка, оранжевая строка адреса, блоки страницы выступают вперёд
  const out: Voxel[] = []
  const w = 7.8
  const h = 5.4
  const left = -w / 2
  const bottom = -h / 2
  out.push(...block(left, bottom, 0, w, h, STEP))
  out.push(...block(left, bottom + h - 0.6, STEP, w, 0.6, STEP, 1))
  out.push(...block(left + 0.6, bottom + 2.4, STEP, 4.2, 1.8, 0.9))
  out.push(...block(left + 5.1, bottom + 2.4, STEP, 2.1, 1.8, 0.6))
  for (let i = 0; i < 3; i += 1) out.push(...block(left + 0.6 + i * 2.4, bottom + 0.6, STEP, 2.1, 1.5, 0.3 + i * 0.3))
  return out
}

function bot(): Voxel[] {
  // переписка: облачка слева от бота, справа — оранжевые от человека
  const bubbles: [x: number, w: number, accent: number][] = [
    [-3.6, 4.5, 0],
    [0.3, 3.3, 1],
    [-3.6, 5.4, 0],
    [0.9, 2.7, 1],
  ]
  const out: Voxel[] = []
  bubbles.forEach(([x, w, accent], i) => {
    const y = 2.4 - i * 1.65
    out.push(...block(x, y, -0.45, w, 1.2, 0.9, accent))
    // хвостик облачка
    out.push(...block(accent ? x + w - STEP : x, y - 0.3, -0.15, STEP, STEP, STEP, accent))
  })
  return out
}

function crm(): Voxel[] {
  // канбан: четыре колонки карточек, одна карточка в пути между колонками
  const counts = [4, 3, 5, 2]
  const out: Voxel[] = []
  counts.forEach((count, col) => {
    const x = -3.9 + col * 2.1
    out.push(...block(x, -3, -1.2, 1.8, STEP, 2.4))
    for (let i = 0; i < count; i += 1) out.push(...block(x, -2.4 + i * 1.05, -0.9, 1.8, 0.6, 1.8))
  })
  out.push(...block(-0.75, 1.2, -0.6, 1.8, 0.6, 1.2, 1))
  return out
}

function wave(): Voxel[] {
  // поверхность графика: высоту задаёт сцена в каждом кадре, оранжевая — линия сигнала
  const out: Voxel[] = []
  for (const x of range(-4.2, 4.2)) for (const z of range(-3.3, 3.3)) out.push([x, 0, z, Math.abs(z) < 0.1 ? 1 : 0])
  return out
}

function funnel(): Voxel[] {
  // воронка: кольца сужаются книзу, из горлышка падает струя отобранных данных
  const out: Voxel[] = []
  for (let ring = 0; ring < 9; ring += 1) {
    const y = 2.7 - ring * 0.45
    const radius = 3.6 - ring * 0.38
    const n = Math.max(8, Math.round((2 * Math.PI * radius) / STEP))
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2
      out.push([Math.cos(a) * radius, y, Math.sin(a) * radius, 0])
    }
  }
  for (let i = 0; i < 9; i += 1) out.push([0, -1.5 - i * 0.33, 0, 1], [STEP, -1.5 - i * 0.33, 0, 1], [0, -1.5 - i * 0.33, STEP, 1])
  return out
}

function calendar(): Voxel[] {
  // неделя записей: плитки дней, занятые подняты и оранжевые
  const booked = [2, 6, 9, 15, 17, 24, 27]
  const out: Voxel[] = []
  for (let i = 0; i < 28; i += 1) {
    const x = -3.9 + (i % 7) * 1.2
    const z = -2.4 + Math.floor(i / 7) * 1.2
    const taken = booked.includes(i)
    out.push(...block(x, -1.2, z, 0.9, taken ? 1.5 : STEP, 0.9, taken ? 1 : 0))
  }
  return out
}

function boxes(): Voxel[] {
  // витрина: коробки разного размера на двух полках, одна в корзине
  const out: Voxel[] = []
  out.push(...block(-4, -2.4, -1.2, 8.1, STEP, 2.4))
  out.push(...block(-4, 0.3, -1.2, 8.1, STEP, 2.4))
  const items: [x: number, w: number, h: number, shelf: number][] = [
    [-3.6, 1.2, 1.5, 0],
    [-2, 0.9, 0.9, 0],
    [-0.6, 1.5, 2.1, 0],
    [1.5, 1.2, 1.2, 0],
    [-3.3, 1.5, 1.2, 1],
    [-1.2, 0.9, 1.8, 1],
    [0.3, 1.2, 0.9, 1],
  ]
  for (const [x, w, h, shelf] of items) out.push(...block(x, shelf ? 0.6 : -2.1, -0.6, w, h, 1.2))
  out.push(...block(2.4, 1.2, -0.45, 1.2, 1.2, 0.9, 1))
  return out
}

function bars(): Voxel[] {
  // цены продавцов: столбцы по убыванию, минимум подсвечен
  const heights = [16, 14, 12, 11, 9, 7]
  const out: Voxel[] = []
  heights.forEach((h, i) => out.push(...block(-3.6 + i * 1.35, -2.7, -0.45, 0.9, h * STEP, 0.9, i === heights.length - 1 ? 1 : 0)))
  out.push(...block(-4.2, -3, -0.9, 8.7, STEP, 1.8))
  return out
}

function cards(): Voxel[] {
  // подписка: стопка карт тарифов, верхняя — оранжевая
  const out: Voxel[] = []
  for (let i = 0; i < 4; i += 1) out.push(...block(-3 + i * 0.45, -1.8 + i * 0.9, -1.5 + i * 0.3, 5.4, STEP, 3, i === 3 ? 1 : 0))
  return out
}

function plane(): Voxel[] {
  // бумажный самолётик: два крыла и киль
  const out: Voxel[] = []
  const nose: [number, number, number] = [4, 0.6, 0]
  const tri = (a: number[], b: number[], c: number[], accent: number) => {
    const steps = 30
    for (let u = 0; u <= steps; u += 1)
      for (let v = 0; v <= steps - u; v += 1) {
        const p = [0, 1, 2].map((k) => a[k] + ((b[k] - a[k]) * u) / steps + ((c[k] - a[k]) * v) / steps)
        out.push([p[0], p[1], p[2], accent])
      }
  }
  tri(nose, [-3.6, 0.9, -3.3], [-3.2, 0, 0], 0)
  tri(nose, [-3.6, 0.9, 3.3], [-3.2, 0, 0], 0)
  tri(nose, [-3.2, 0, 0], [-3.2, -1.5, 0], 1)
  return out
}

const BUILDERS: Record<ShapeId, () => Voxel[]> = { core, services, site, bot, crm, wave, funnel, calendar, boxes, bars, cards, plane }

/** Кубики формы приводятся к ровно `count`: лишние прореживаются, недостающие кружат пылью вокруг фигуры. */
export function buildShape(id: ShapeId, count: number): ShapeData {
  const voxels = BUILDERS[id]()
  // центр фигуры — в начале координат
  const center = [0, 1, 2].map((k) => voxels.reduce((sum, v) => sum + v[k], 0) / voxels.length)
  const rand = random(id.length * 7919 + voxels.length)
  const picked = voxels.length > count ? voxels.filter((_, i) => Math.floor((i * count) / voxels.length) !== Math.floor(((i - 1) * count) / voxels.length)) : voxels
  const positions = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const accents = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    const voxel = picked[i]
    if (voxel) {
      positions.set([voxel[0] - center[0], voxel[1] - center[1], voxel[2] - center[2]], i * 3)
      scales[i] = 1
      accents[i] = voxel[3]
    } else {
      const a = rand() * Math.PI * 2
      const r = 4.9 + rand() * 1.4
      positions.set([Math.cos(a) * r, (rand() - 0.5) * 1.4, Math.sin(a) * r], i * 3)
      scales[i] = 0.3 + rand() * 0.2
      accents[i] = rand() < 0.12 ? 1 : 0
    }
  }
  return { positions, scales, accents, animated: id === 'wave' }
}
