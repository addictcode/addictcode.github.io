/** Маленькие помощники для анимации по прогрессу скролла. */

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Доля пути от a до b, в пределах 0…1. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
export const easeOut = (t: number) => 1 - (1 - t) ** 3

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Положение карточки: центр, размеры, поворот и скругление. */
export interface Box {
  x: number
  y: number
  w: number
  h: number
  /** поворот, градусы */
  r: number
  /** скругление углов, px */
  rad: number
  /** высота дуги, по которой карточка прыгает в этот кадр */
  arc?: number
}

export interface Key {
  p: number
  box: Box
}

/** Положение карточки на прогрессе p: плавно между соседними ключами. */
export function track(keys: Key[], p: number): Box {
  if (p <= keys[0].p) return keys[0].box
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i]
    const b = keys[i + 1]
    if (p > b.p) continue
    const t = easeInOut(seg(p, a.p, b.p))
    return {
      x: lerp(a.box.x, b.box.x, t),
      y: lerp(a.box.y, b.box.y, t) - (b.box.arc ?? 0) * Math.sin(Math.PI * t),
      w: lerp(a.box.w, b.box.w, t),
      h: lerp(a.box.h, b.box.h, t),
      r: lerp(a.box.r, b.box.r, t),
      rad: lerp(a.box.rad, b.box.rad, t),
    }
  }
  return keys[keys.length - 1].box
}
