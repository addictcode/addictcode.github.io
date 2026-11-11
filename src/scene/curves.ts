/**
 * Форма лент. Каждая лента — прямая, уходящая за края экрана, которую в середине
 * закручивает узел. У каждой главы свой узел; между главами точки плавно перетекают.
 */

export const SEGMENTS = 320
const TAU = Math.PI * 2

/** Параметры узла: амплитуды, частоты и фазы по трём осям плюс число оборотов самой ленты. */
export interface Knot {
  a: [number, number, number]
  f: [number, number, number]
  ph: [number, number, number]
  twist: number
  /** наклон прямой части */
  slope: number
}

/** по одному узлу на главу */
export const KNOTS: Knot[] = [
  { a: [3.2, 3.0, 3.0], f: [1.0, 1.5, 1.0], ph: [0, 0.6, 1.57], twist: 2, slope: -0.14 },
  { a: [4.6, 2.2, 2.0], f: [0.5, 2.0, 1.0], ph: [0, 0, 1.2], twist: 1, slope: 0.1 },
  { a: [1.2, 3.4, 3.4], f: [1.0, 2.5, 2.5], ph: [0, 0, 1.57], twist: 4, slope: -0.05 },
  { a: [4.4, 2.6, 2.6], f: [1.0, 2.0, 1.0], ph: [0, 0, 0.8], twist: 0, slope: 0.16 },
  { a: [0.6, 2.4, 1.4], f: [1.0, 4.5, 2.0], ph: [0, 1.0, 0], twist: 6, slope: 0 },
  { a: [3.0, 3.6, 3.0], f: [1.5, 1.0, 1.5], ph: [1.57, 0, 0], twist: 3, slope: -0.2 },
  { a: [3.8, 3.4, 1.6], f: [1.0, 1.0, 2.0], ph: [1.57, 0, 0], twist: 1, slope: 0.08 },
]

/** Точка узла главы в параметре t ∈ [−1, 1]. shift разводит три ленты по фазе. */
export function knotPoint(knot: Knot, t: number, shift: number, gain: number, out: [number, number, number]): void {
  const envelope = Math.exp(-Math.pow(Math.abs(t) / 0.46, 3)) * gain
  out[0] = t * 30 + envelope * knot.a[0] * Math.sin(TAU * knot.f[0] * t + knot.ph[0] + shift)
  out[1] = t * 30 * knot.slope + envelope * knot.a[1] * Math.sin(TAU * knot.f[1] * t + knot.ph[1] + shift * 1.7)
  out[2] = envelope * knot.a[2] * Math.sin(TAU * knot.f[2] * t + knot.ph[2] + shift * 0.6)
}
