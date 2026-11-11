/** Иконки рисуются линиями, без эмодзи. Все декоративные: aria-hidden. */

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  'aria-hidden': true,
  focusable: false,
} as const

export function ArrowOut() {
  return (
    <svg {...base}>
      <path d="M4 12 12 4M5.5 4H12v6.5" />
    </svg>
  )
}

export function ArrowRight() {
  return (
    <svg {...base}>
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  )
}

export function PlaneIcon() {
  return (
    <svg {...base}>
      <path d="M14 2 1.5 7l4.5 1.8M14 2l-2.5 11.5L6 8.8M14 2 6 8.8v4l2.3-2.2" strokeLinejoin="round" />
    </svg>
  )
}
