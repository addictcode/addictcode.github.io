/** Иконки рисуются линиями, без эмодзи. Все декоративные. */

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

export function ArrowOut() {
  return (
    <svg {...base}>
      <path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" />
    </svg>
  )
}

export function ArrowDown() {
  return (
    <svg {...base}>
      <path d="M8 2.5v11M3.5 9 8 13.5 12.5 9" />
    </svg>
  )
}

export function Plus() {
  return (
    <svg {...base}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  )
}

/** Одна галочка: «доставлено». */
export function Tick() {
  return (
    <svg {...base} viewBox="0 0 16 12">
      <path d="M2 6.5 5.5 10 14 1.5" />
    </svg>
  )
}

/** Две галочки: «доставлено и прочитано». Это же знак студии. */
export function Ticks() {
  return (
    <svg {...base} viewBox="0 0 22 12">
      <path d="M1.5 6.5 5 10 13.5 1.5M9.5 9l1 1L19 1.5" />
    </svg>
  )
}
