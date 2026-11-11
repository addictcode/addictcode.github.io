interface BarcodeProps {
  /** строка, из которой детерминированно получаются штрихи */
  value: string
  height?: number
}

function barsFrom(value: string): number[] {
  const widths: number[] = []
  let seed = 7
  for (const ch of value) seed = (seed * 31 + ch.charCodeAt(0)) % 9973
  for (let i = 0; i < 44; i += 1) {
    seed = (seed * 137 + 11) % 9973
    widths.push(1 + (seed % 3))
  }
  return widths
}

/** Декоративный штрихкод: чередование чёрных штрихов и пробелов. */
export function Barcode({ value, height = 34 }: BarcodeProps) {
  const widths = barsFrom(value)
  const total = widths.reduce((sum, w) => sum + w, 0)
  const rects: { x: number; w: number }[] = []
  let x = 0
  widths.forEach((w, i) => {
    if (i % 2 === 0) rects.push({ x, w })
    x += w
  })
  return (
    <svg
      className="barcode"
      viewBox={`0 0 ${total} 10`}
      height={height}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {rects.map((r) => (
        <rect key={r.x} x={r.x} y={0} width={r.w} height={10} />
      ))}
    </svg>
  )
}
