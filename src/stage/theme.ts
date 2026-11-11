/** Цвета экранов: фон, текст и акцент ленты. Общие для CSS и 3D-сцены. */

export type Rgb = [number, number, number]

export interface Theme {
  bg: Rgb
  ink: Rgb
  accent: Rgb
  /** цвет надписи на акцентной ленте */
  accentInk: Rgb
}

const hex = (value: string): Rgb => [
  parseInt(value.slice(1, 3), 16),
  parseInt(value.slice(3, 5), 16),
  parseInt(value.slice(5, 7), 16),
]

const CREAM = '#f6f1e4'
const BLACK = '#111111'
const BLUE = '#1f3bff'
const YELLOW = '#ffd400'
const RED = '#ff4127'

const make = (bg: string, ink: string, accent: string, accentInk: string): Theme => ({
  bg: hex(bg),
  ink: hex(ink),
  accent: hex(accent),
  accentInk: hex(accentInk),
})

/** по одной теме на главу, в порядке глав */
export const THEMES: Theme[] = [
  make(BLUE, CREAM, YELLOW, BLACK),
  make('#f3eee2', BLACK, RED, BLACK),
  make(YELLOW, BLACK, BLUE, CREAM),
  make(BLACK, CREAM, RED, BLACK),
  make(RED, BLACK, CREAM, BLACK),
  make('#0c6b52', CREAM, YELLOW, BLACK),
  make('#f3a9c6', BLACK, BLUE, CREAM),
]

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

/** Тема для дробного прогресса: между главами цвета плавно перетекают. */
export function themeAt(progress: number): Theme {
  const last = THEMES.length - 1
  const from = Math.min(last, Math.max(0, Math.floor(progress)))
  const to = Math.min(last, from + 1)
  const t = Math.min(1, Math.max(0, progress - from))
  const a = THEMES[from]
  const b = THEMES[to]
  return { bg: mix(a.bg, b.bg, t), ink: mix(a.ink, b.ink, t), accent: mix(a.accent, b.accent, t), accentInk: mix(a.accentInk, b.accentInk, t) }
}

export const css = (rgb: Rgb) => `rgb(${Math.round(rgb[0])} ${Math.round(rgb[1])} ${Math.round(rgb[2])})`

/** CSS-переменные темы для элемента (секции в статичной версии или корня страницы). */
export function themeVars(theme: Theme): Record<string, string> {
  return { '--bg': css(theme.bg), '--ink': css(theme.ink), '--accent': css(theme.accent), '--accent-ink': css(theme.accentInk) }
}

export function applyTheme(progress: number): void {
  const vars = themeVars(themeAt(progress))
  const root = document.documentElement
  for (const key in vars) root.style.setProperty(key, vars[key])
}
