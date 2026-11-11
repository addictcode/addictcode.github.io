/**
 * Формы, в которые складываются одни и те же 216 кубиков.
 * Каждая форма — список из COUNT точек [x, y, z, акцент].
 */

export const COUNT = 216
export const CELL = 0.5

export type Point = [number, number, number, number]

/** Подгоняет список под COUNT: лишние точки отбрасывает, недостающие прячет внутри формы. */
function fit(points: Point[]): Point[] {
  const out = points.slice(0, COUNT)
  for (let i = 0; out.length < COUNT; i += 1) out.push([...points[(i * 7) % points.length]] as Point)
  return out
}

/** 0. Начало: цельный куб 6×6×6. */
function cube(): Point[] {
  const points: Point[] = []
  for (let y = 0; y < 6; y += 1)
    for (let z = 0; z < 6; z += 1)
      for (let x = 0; x < 6; x += 1)
        points.push([(x - 2.5) * CELL, (y - 2.5) * CELL, (z - 2.5) * CELL, x === 5 && y === 5 && z === 5 ? 1 : 0])
  return points
}

/** 1. Сайт: окно браузера 18×12 с шапкой, первым экраном, кнопкой и карточками каталога. */
function site(): Point[] {
  const points: Point[] = []
  for (let j = 11; j >= 0; j -= 1)
    for (let i = 0; i < 18; i += 1) {
      const header = j === 11
      const heroBlock = j >= 7 && j <= 9 && i >= 1 && i <= 9
      const button = j === 7 && i >= 12 && i <= 15
      const card = j >= 1 && j <= 4 && i % 6 >= 1 && i % 6 <= 4
      const depth = button ? 2 : header || heroBlock || card ? 1 : 0
      points.push([(i - 8.5) * CELL, (j - 5.5) * CELL, depth * CELL * 0.6, button ? 1 : 0])
    }
  return points
}

/** 2. Бот: три сообщения в чате, ответ бота выделен. */
function bot(): Point[] {
  const points: Point[] = []
  for (let k = 0; k < 3; k += 1)
    for (let z = 0; z < 2; z += 1)
      for (let j = 0; j < 4; j += 1)
        for (let i = 0; i < 9; i += 1)
          points.push([
            (i - 4) * CELL + (k === 1 ? 1.3 : -1.3),
            (1 - k) * 2.5 + (j - 1.5) * CELL,
            (z - 0.5) * CELL + (k - 1) * 0.5,
            k === 1 ? 1 : 0,
          ])
  return points
}

/** 3. CRM: девять этапов заказа лестницей, от заявки до аналитики. */
function crm(): Point[] {
  const points: Point[] = []
  for (let step = 0; step < 9; step += 1)
    for (let y = 0; y < step + 2; y += 1)
      for (let z = 0; z < 2; z += 1)
        for (let x = 0; x < 2; x += 1)
          points.push([
            (step - 4) * 1.05 + (x - 0.5) * CELL,
            -2.6 + y * CELL,
            (z - 0.5) * CELL,
            step === 8 && y === step + 1 ? 1 : 0,
          ])
  return points
}

/** 4. Реальное время: поверхность 18×12, по которой на скролле идёт волна. */
function realtime(): Point[] {
  const points: Point[] = []
  for (let j = 0; j < 12; j += 1)
    for (let i = 0; i < 18; i += 1) points.push([(i - 8.5) * CELL, 0, (j - 5.5) * CELL, i === 12 ? 1 : 0])
  return points
}

/** 5. Парсинг и LLM: воронка из колец, внизу остаётся одна запись без дублей. */
function parsing(): Point[] {
  const points: Point[] = []
  for (let ring = 0; ring < 9; ring += 1) {
    const count = 40 - ring * 4
    const radius = (count * CELL * 1.12) / (Math.PI * 2)
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2
      points.push([Math.cos(angle) * radius, 2.3 - ring * CELL * 1.15, Math.sin(angle) * radius, ring === 8 ? 1 : 0])
    }
  }
  return points
}

/** 6. Стек: шесть отдельных блоков по группам инструментов. */
function stack(): Point[] {
  const points: Point[] = []
  for (let block = 0; block < 6; block += 1)
    for (let y = 0; y < 4; y += 1)
      for (let z = 0; z < 3; z += 1)
        for (let x = 0; x < 3; x += 1)
          points.push([
            ((block % 3) - 1) * 2.3 + (x - 1) * CELL,
            (block < 3 ? 0.35 : -2.35) + y * CELL,
            (block < 3 ? -0.9 : 0.9) + (z - 1) * CELL,
            block === 4 && y === 3 ? 1 : 0,
          ])
  return points
}

/** 7. Контакты: стрелка к кнопке. */
function arrow(): Point[] {
  const points: Point[] = []
  for (let z = 0; z < 2; z += 1) {
    for (let i = 0; i < 11; i += 1)
      for (let j = -2; j < 2; j += 1) points.push([(i - 8) * CELL, (j + 0.5) * CELL, (z - 0.5) * CELL, 0])
    for (let i = 0; i < 6; i += 1)
      for (let j = -(6 - i); j < 6 - i; j += 1) points.push([(i + 3) * CELL, (j + 0.5) * CELL, (z - 0.5) * CELL, 1])
  }
  return points
}

export const FORMATIONS: Point[][] = [cube, site, bot, crm, realtime, parsing, stack, arrow].map((make) => fit(make()))

/** Ракурс для каждой формы: поворот вокруг вертикали и наклон. */
export const VIEWS: [number, number][] = [
  [0.68, 0.52],
  [-0.42, 0.14],
  [0.44, 0.12],
  [-0.5, 0.26],
  [0.62, 0.62],
  [0.3, 0.42],
  [-0.56, 0.46],
  [0.36, 0.16],
]

/** Масштаб формы: компактные фигуры крупнее, широкие мельче. */
export const SCALES = [1.75, 1.02, 1.08, 0.98, 1.05, 1.2, 1.15, 1.08]

/** Живые формы зависят от скролла: волна на поверхности и вращение колец воронки. */
export function animate(formation: number, index: number, point: Point, p: number, out: [number, number, number]): void {
  out[0] = point[0]
  out[1] = point[1]
  out[2] = point[2]
  if (formation === 4) {
    const i = index % 18
    const j = Math.floor(index / 18)
    out[1] = 0.55 * Math.sin(i * 0.5 + p * 7) * Math.cos(j * 0.45 - p * 4) + 0.25 * Math.sin(i * 0.9 - p * 9)
  } else if (formation === 5) {
    const spin = (p - 5) * (0.8 + (index % 5) * 0.12) * (Math.floor(point[1] * 2) % 2 ? 1 : -1)
    const cos = Math.cos(spin)
    const sin = Math.sin(spin)
    out[0] = point[0] * cos - point[2] * sin
    out[2] = point[0] * sin + point[2] * cos
  }
}
