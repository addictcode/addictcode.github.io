import type { Object3D } from 'three'
import { STATION_SPACING } from '../stage/framing'
import { TONE, type Spec, type Vec3 } from './geometry'

const { white: W, mid: M, dark: D, kraft: K, signal: O } = TONE

export const STATIONS = 8
export const BELT_Y = 1
export const BELT_START = -5.5
export const BELT_END = (STATIONS - 1) * STATION_SPACING + 3.2
/** высота, на которой висит штамп пресса, и глубина хода */
export const PRESS_UP = 3.05
export const PRESS_DROP = 0.6

const box = (at: Vec3, size: Vec3, color: string, rot?: Vec3): Spec => ({ at, size, color, rot })
const cyl = (at: Vec3, size: Vec3, color: string, rot?: Vec3): Spec => ({ kind: 'cyl', at, size, color, rot })
const shift = (specs: Spec[], dx: number): Spec[] =>
  specs.map((spec) => ({ ...spec, at: [spec.at[0] + dx, spec.at[1], spec.at[2]] }))

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const ease = (v: number) => v * v * (3 - 2 * v)
/** доля a, приходящаяся на элемент j из n, с перекрытием соседних */
const stagger = (a: number, j: number, n: number) => ease(clamp01(a * (n * 0.5 + 1) - j * 0.5))

/** Подвижная деталь станции. a — насколько посылка доехала до станции (0…1), p — общий прогресс. */
export interface Mover {
  station: number
  specs: Spec[]
  at: Vec3
  apply: (object: Object3D, a: number, p: number) => void
}

/* ───────── Лента ───────── */
function belt(): Spec[] {
  const length = BELT_END - BELT_START
  const mid = (BELT_START + BELT_END) / 2
  const specs: Spec[] = [
    box([mid, BELT_Y - 0.28, 0], [length, 0.28, 2.3], D),
    box([mid, BELT_Y - 0.36, 1.22], [length, 0.5, 0.14], W),
    box([mid, BELT_Y - 0.36, -1.22], [length, 0.5, 0.14], W),
    cyl([BELT_START, BELT_Y - 0.14, -1.15], [0.14, 2.3, 10], D, [Math.PI / 2, 0, 0]),
  ]
  for (let x = BELT_START + 0.6; x < BELT_END; x += 3.5) {
    specs.push(box([x, 0, 1.05], [0.2, BELT_Y - 0.36, 0.2], M), box([x, 0, -1.05], [0.2, BELT_Y - 0.36, 0.2], M))
    specs.push(box([x, 0.22, 0], [0.12, 0.12, 2.1], M))
  }
  return specs
}

/* ───────── Пресс со штампом: стоит на каждой станции ───────── */
function press(): Spec[] {
  return [
    box([0, 0, -2.1], [1.0, 0.16, 1.0], D),
    box([0, 0.16, -2.1], [0.5, 4.5, 0.5], W),
    box([0, 4.1, -0.9], [0.5, 0.42, 2.9], W),
    box([0, 3.55, 0], [0.9, 0.62, 0.9], M),
    box([0, 4.52, 0], [0.34, 0.2, 0.34], O),
    // табличка с номером станции
    box([-2.6, 0, 2.3], [0.14, 2.4, 0.14], D),
    box([-2.6, 1.4, 2.3], [1.5, 1.0, 0.1], W),
  ]
}

function pressHead(station: number): Mover {
  return {
    station,
    at: [0, PRESS_UP, 0],
    specs: [box([0, 0.2, 0], [0.16, 0.6, 0.16], D), box([0, 0, 0], [1.0, 0.2, 0.8], O)],
    apply: (object, _a, p) => {
      const u = (p - (station - 0.04)) / 0.04
      object.position.y = PRESS_UP - PRESS_DROP * Math.max(0, 1 - u * u)
    },
  }
}

function slab(width: number, depth: number, z: number, x = 0): Spec {
  return box([x, 0, z], [width, 0.06, depth], W)
}

function pallet(x: number, z: number): Spec[] {
  return [
    box([x, 0, z - 0.7], [2.2, 0.12, 0.2], M),
    box([x, 0, z], [2.2, 0.12, 0.2], M),
    box([x, 0, z + 0.7], [2.2, 0.12, 0.2], M),
    box([x, 0.12, z], [2.2, 0.1, 1.7], M),
  ]
}

/* ───────── 0. Приёмка: ворота склада и паллета с коробками ───────── */
function intake(): { specs: Spec[]; movers: Mover[] } {
  const specs: Spec[] = [
    slab(11, 4.6, -5.2, -0.5),
    box([-1, 0.06, -6.6], [8.4, 4.4, 0.5], W),
    box([-1, 0.06, -6.32], [4.6, 3.4, 0.08], D),
    box([-1, 4.46, -6.6], [8.8, 0.22, 0.7], D),
    ...pallet(3.4, -4.2),
    box([3.0, 0.22, -4.4], [1.0, 0.9, 1.0], K),
    box([4.0, 0.22, -4.0], [0.8, 0.7, 0.9], K),
    box([3.2, 1.12, -4.35], [0.8, 0.6, 0.8], K),
    // принтер этикеток у ленты
    box([-4.6, 0, -2.3], [1.0, 1.25, 0.9], M),
    box([-4.6, 1.25, -2.3], [1.2, 0.5, 1.1], W),
    box([-4.6, 1.38, -1.72], [0.7, 0.05, 0.3], W),
    // разметка зоны приёмки
    box([-4.2, 0, 2.6], [3.2, 0.03, 0.14], O),
    box([-4.2, 0, 4.4], [3.2, 0.03, 0.14], O),
    box([-5.73, 0, 3.5], [0.14, 0.03, 1.94], O),
    box([-2.67, 0, 3.5], [0.14, 0.03, 1.94], O),
    box([-4.7, 0, 3.5], [1.2, 0.9, 1.1], K),
    box([-3.5, 0, 3.4], [0.9, 0.6, 0.9], K),
  ]
  for (let i = 0; i < 6; i += 1) specs.push(box([-1, 0.5 + i * 0.52, -6.27], [4.6, 0.06, 0.06], M))
  return { specs, movers: [] }
}

/* ───────── 1. Сайт: экран, на котором собирается каталог ───────── */
function site(): { specs: Spec[]; movers: Mover[] } {
  const specs: Spec[] = [
    slab(9.4, 3.6, -5.3),
    box([-2.6, 0.06, -5.5], [0.3, 1.3, 0.3], D),
    box([2.6, 0.06, -5.5], [0.3, 1.3, 0.3], D),
    box([0, 1.3, -5.5], [7.6, 5.0, 0.3], D),
    box([0, 1.5, -5.33], [7.2, 4.6, 0.06], W),
    box([0, 5.6, -5.28], [7.2, 0.5, 0.06], D),
    box([-1.55, 4.0, -5.28], [3.7, 1.4, 0.08], M),
    box([1.95, 4.0, -5.28], [2.9, 1.4, 0.08], O),
    // стойка с клавиатурой
    box([3.6, 0.06, -3.4], [1.5, 1.0, 0.8], M),
    box([3.6, 1.06, -3.4], [1.7, 0.1, 1.0], W),
  ]
  const movers: Mover[] = []
  for (let j = 0; j < 8; j += 1) {
    const col = j % 4
    const row = Math.floor(j / 4)
    movers.push({
      station: 1,
      at: [-2.55 + col * 1.7, 2.85 - row * 1.1, -5.3],
      specs: [box([0, 0, 0], [1.4, 0.85, 0.14], j === 5 ? D : W)],
      apply: (object, a) => {
        const k = stagger(a, j, 8)
        object.position.z = -5.3 + 0.12 * k
        object.scale.setScalar(Math.max(0.001, k))
      },
    })
  }
  return { specs, movers }
}

/* ───────── 2. Бот: мачта, киоск и вылетающие сообщения ───────── */
function bot(): { specs: Spec[]; movers: Mover[] } {
  const specs: Spec[] = [
    slab(8.6, 3.6, -5.0),
    box([1.6, 0.06, -5.0], [2.6, 2.6, 2.0], W),
    box([1.6, 2.66, -5.0], [2.8, 0.2, 2.2], D),
    box([1.6, 1.3, -3.98], [2.0, 1.0, 0.06], D),
    box([1.15, 1.72, -3.94], [0.34, 0.34, 0.05], O),
    box([2.05, 1.72, -3.94], [0.34, 0.34, 0.05], O),
    box([1.6, 0.5, -3.96], [1.2, 0.12, 0.05], M),
    // мачта
    box([-2.6, 0.06, -5.2], [1.1, 0.3, 1.1], D),
    cyl([-2.6, 0.36, -5.2], [0.12, 6.6, 8], D),
    box([-2.6, 4.4, -5.2], [1.3, 0.1, 0.1], D),
    box([-2.6, 5.4, -5.2], [0.9, 0.1, 0.1], D),
  ]
  const movers: Mover[] = [
    {
      station: 2,
      at: [-2.6, 6.4, -5.2],
      specs: [cyl([0, 0, 0.45], [0.75, 0.12, 14], O, [Math.PI / 2, 0, 0]), box([0, -0.06, 0], [0.1, 0.1, 0.5], D)],
      apply: (object, _a, p) => {
        object.rotation.y = p * 4.2
      },
    },
  ]
  for (let j = 0; j < 3; j += 1) {
    movers.push({
      station: 2,
      at: [1.6, 3.0, -4.6],
      specs: [box([0, 0, 0], [1.5, 0.75, 0.12], W), box([-0.45, -0.18, 0], [0.3, 0.2, 0.12], W)],
      apply: (object, a) => {
        const k = stagger(a, j, 3)
        object.position.set(1.6 - j * 0.55, 3.1 + j * 1.05 * k, -4.6 + j * 0.25)
        object.scale.setScalar(Math.max(0.001, k))
      },
    })
  }
  return { specs, movers }
}

/* ───────── 3. CRM: стойка из 15 модулей и база ───────── */
function crm(): { specs: Spec[]; movers: Mover[] } {
  const specs: Spec[] = [
    slab(10.4, 3.8, -5.1, 0.6),
    box([-0.4, 0.06, -5.2], [7.4, 0.3, 1.9], D),
    box([-0.4, 4.0, -5.2], [7.4, 0.22, 1.9], D),
    box([-4.02, 0.36, -5.2], [0.16, 3.64, 1.9], D),
    box([3.22, 0.36, -5.2], [0.16, 3.64, 1.9], D),
    // база данных
    cyl([4.8, 0.06, -5.0], [0.85, 0.7, 16], M),
    cyl([4.8, 0.82, -5.0], [0.85, 0.7, 16], W),
    cyl([4.8, 1.58, -5.0], [0.85, 0.7, 16], M),
    cyl([4.8, 2.34, -5.0], [0.85, 0.7, 16], W),
  ]
  const movers: Mover[] = []
  for (let j = 0; j < 15; j += 1) {
    const col = j % 5
    const row = Math.floor(j / 5)
    const x = -3.2 + col * 1.4
    const y = 0.42 + row * 1.2
    movers.push({
      station: 3,
      at: [x, y, -5.2],
      specs: [box([0, 0, 0], [1.24, 1.08, 1.5], j === 7 ? O : W), box([0, 0.42, 0.76], [0.6, 0.12, 0.05], D)],
      apply: (object, a) => {
        object.position.z = -5.9 + 0.95 * stagger(a, j, 15)
      },
    })
  }
  return { specs, movers }
}

/* ───────── 4. Реальное время: табло со столбцами и очередь задач ───────── */
function realtime(): { specs: Spec[]; movers: Mover[] } {
  const specs: Spec[] = [
    slab(9.6, 4.6, -4.8),
    box([-3.0, 0.06, -6.2], [0.3, 1.0, 0.3], D),
    box([3.0, 0.06, -6.2], [0.3, 1.0, 0.3], D),
    box([0, 1.0, -6.2], [8.0, 4.6, 0.3], D),
    box([0, 1.2, -6.03], [7.6, 4.2, 0.06], W),
    box([0, 1.2, -5.7], [7.6, 0.14, 0.6], D),
    // стол очереди задач с воркерами
    box([0, 0.06, -3.3], [7.0, 0.55, 1.0], M),
    box([0, 0.61, -3.3], [7.2, 0.08, 1.2], D),
    box([4.5, 0.06, -3.3], [1.0, 1.5, 1.0], W),
    box([4.5, 1.56, -3.3], [0.5, 0.2, 0.5], O),
  ]
  const movers: Mover[] = []
  for (let j = 0; j < 10; j += 1) {
    movers.push({
      station: 4,
      at: [-3.15 + j * 0.7, 1.34, -5.7],
      specs: [box([0, 0, 0], [0.46, 1, 0.36], j === 6 ? O : W)],
      apply: (object, _a, p) => {
        const wave = 0.5 + 0.5 * Math.sin(p * 11 + j * 1.7) * Math.cos(p * 5 + j * 0.6)
        object.scale.y = 0.5 + 3.0 * wave
      },
    })
  }
  for (let j = 0; j < 5; j += 1) {
    movers.push({
      station: 4,
      at: [0, 0.69, -3.3],
      specs: [box([0, 0, 0], [0.6, 0.5, 0.6], K)],
      apply: (object, a, p) => {
        const travel = ((j / 5 + a * 0.9 + Math.max(0, p - 4) * 0.9) % 1) * 6.4
        object.position.x = -3.2 + travel
      },
    })
  }
  return { specs, movers }
}

/* ───────── 5. Парсинг и LLM: три источника сходятся в один бункер ───────── */
function parsing(): { specs: Spec[]; movers: Mover[] } {
  const specs: Spec[] = [slab(10.6, 5.6, -5.2)]
  const sources = [-3.6, 0, 3.6]
  const tilt = Math.atan2(1.55, 3.2)
  sources.forEach((x, i) => {
    specs.push(box([x, 0.06, -7.2], [2.0, 3.6 - i * 0.35, 1.3], i === 1 ? M : W))
    specs.push(box([x, 3.66 - i * 0.35, -7.2], [2.2, 0.16, 1.5], D))
    // жёлоб от источника к бункеру
    specs.push(box([x * 0.64, 2.3, -4.8], [0.9, 0.1, 3.9], W, [tilt, -Math.atan2(x * 0.72, 3.2), 0]))
  })
  specs.push(
    box([0, 0.06, -2.9], [2.6, 1.3, 1.5], D),
    box([0, 1.36, -2.9], [3.0, 0.16, 1.9], W),
    // блок оценки: LLM
    box([4.2, 0.06, -3.2], [1.5, 1.9, 1.5], W),
    box([4.2, 1.96, -3.2], [0.8, 0.5, 0.8], O),
    box([2.5, 0.5, -3.0], [2.0, 0.12, 0.12], D),
  )
  const movers: Mover[] = sources.map((x, j) => ({
    station: 5,
    at: [x, 3.2, -6.4] as Vec3,
    specs: [box([0, 0, 0], [0.6, 0.45, 0.6], j === 1 ? O : K)],
    apply: (object: Object3D, a: number) => {
      const k = stagger(a, j, 3)
      object.position.set(x * (1 - 0.72 * k), 3.25 - 1.55 * k, -6.4 + 3.2 * k)
    },
  }))
  return { specs, movers }
}

/* ───────── 6. Сортировка: ящики, в которые падает стек ───────── */
function crate(x: number, z: number, w: number, h: number, d: number): Spec[] {
  const t = 0.1
  return [
    box([x, 0.06, z], [w, t, d], M),
    box([x - w / 2 + t / 2, 0.06, z], [t, h, d], W),
    box([x + w / 2 - t / 2, 0.06, z], [t, h, d], W),
    box([x, 0.06, z - d / 2 + t / 2], [w, h, t], W),
    box([x, 0.06, z + d / 2 - t / 2], [w, h * 0.55, t], W),
    box([x, 0.06 + h * 0.2, z + d / 2], [w * 0.5, 0.3, 0.04], D),
  ]
}

function sorting(): { specs: Spec[]; movers: Mover[] } {
  const crates = [
    { x: -4.2, z: -3.6, w: 1.9, h: 1.3, d: 1.6 },
    { x: -1.9, z: -3.6, w: 1.9, h: 1.3, d: 1.6 },
    { x: 0.6, z: -3.6, w: 2.3, h: 1.5, d: 1.6 },
    { x: 3.2, z: -3.6, w: 2.1, h: 1.1, d: 1.6 },
    { x: -3.1, z: -5.8, w: 2.6, h: 1.9, d: 1.7 },
    { x: 0.4, z: -5.8, w: 1.7, h: 1.6, d: 1.7 },
  ]
  const specs: Spec[] = [slab(10.6, 5.2, -4.8, -0.4)]
  crates.forEach((c) => specs.push(...crate(c.x, c.z, c.w, c.h, c.d)))
  // направляющая над ящиками
  specs.push(
    box([-5.6, 0.06, -4.7], [0.24, 4.6, 0.24], D),
    box([4.8, 0.06, -4.7], [0.24, 4.6, 0.24], D),
    box([-0.4, 4.5, -4.7], [10.8, 0.2, 0.3], D),
  )
  const colors = [W, D, O, W, D, W]
  const movers: Mover[] = crates.map((c, j) => ({
    station: 6,
    at: [c.x, 4.0, c.z] as Vec3,
    specs: [box([0, 0, 0], [0.8, 0.6, 0.8], colors[j])],
    apply: (object: Object3D, a: number) => {
      const k = stagger(a, j, 6)
      object.position.y = 3.85 - (3.85 - 0.2) * k * k
    },
  }))
  return { specs, movers }
}

/* ───────── 7. Выдача: рампа, ворота и флажок ───────── */
function dispatch(): { specs: Spec[]; movers: Mover[] } {
  const specs: Spec[] = [
    slab(9.0, 7.6, -1.6, 4.2),
    box([3.3, BELT_Y - 0.5, 0], [0.24, 0.9, 2.5], O),
    // стеллаж выданных посылок
    box([-2.4, 0.06, -5.0], [5.2, 0.14, 1.5], D),
    box([-2.4, 1.5, -5.0], [5.2, 0.14, 1.5], D),
    box([-2.4, 2.94, -5.0], [5.2, 0.14, 1.5], D),
    box([-4.93, 0.06, -5.0], [0.14, 3.02, 1.5], D),
    box([0.13, 0.06, -5.0], [0.14, 3.02, 1.5], D),
    box([-4.0, 0.2, -5.0], [1.1, 0.9, 1.0], K),
    box([-2.5, 0.2, -5.0], [1.3, 1.1, 1.1], K),
    box([-3.4, 1.64, -5.0], [1.4, 0.8, 1.0], K),
    box([-1.3, 1.64, -5.0], [1.0, 1.0, 1.0], K),
    // ворота выдачи
    box([5.4, 0.06, -3.4], [0.5, 4.4, 0.5], W),
    box([5.4, 0.06, 2.4], [0.5, 4.4, 0.5], W),
    box([5.4, 4.46, -0.5], [0.7, 0.6, 6.6], D),
    ...pallet(5.4, -0.5),
    cyl([7.6, 0.06, 0.6], [0.07, 5.2, 8], D),
  ]
  const movers: Mover[] = [
    {
      station: 7,
      at: [7.6, 1.2, 1.3],
      specs: [box([0, 0, 0], [0.06, 0.9, 1.4], O)],
      apply: (object, a) => {
        object.position.y = 1.0 + 3.3 * ease(a)
      },
    },
  ]
  return { specs, movers }
}

const BUILDERS = [intake, site, bot, crm, realtime, parsing, sorting, dispatch]

export interface Line {
  specs: Spec[]
  movers: Mover[]
}

/** Вся линия: общая статика одним списком и подвижные детали по станциям. */
export function createLine(): Line {
  const specs: Spec[] = [...belt()]
  const movers: Mover[] = []
  BUILDERS.forEach((builder, station) => {
    const x0 = station * STATION_SPACING
    const part = builder()
    specs.push(...shift(press(), x0), ...shift(part.specs, x0))
    movers.push(pressHead(station), ...part.movers)
  })
  return { specs, movers }
}
