import { CanvasTexture, SRGBColorSpace } from 'three'
import { TONE } from './geometry'

const DISPLAY = '"Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif'

function canvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  return [element, element.getContext('2d')!]
}

function finish(element: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(element)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Транспортная этикетка на крышке посылки. Только графика: текст сайта живёт в HTML. */
export function labelTexture(): CanvasTexture {
  const [element, ctx] = canvas(384, 256)
  ctx.fillStyle = '#fbf8f1'
  ctx.fillRect(0, 0, 384, 256)
  ctx.strokeStyle = TONE.ink
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, 376, 248)
  ctx.fillStyle = TONE.ink
  ctx.fillRect(4, 4, 376, 54)
  ctx.fillStyle = TONE.signal
  ctx.fillRect(292, 4, 88, 54)
  ctx.fillStyle = '#fbf8f1'
  ctx.font = `800 44px ${DISPLAY}`
  ctx.textBaseline = 'middle'
  ctx.fillText('MSQ → BY', 20, 34)
  ctx.fillStyle = TONE.ink
  for (let i = 0; i < 3; i += 1) ctx.fillRect(22, 82 + i * 24, 200 - i * 46, 10)
  let x = 22
  let seed = 5
  while (x < 360) {
    seed = (seed * 37 + 11) % 97
    const w = 3 + (seed % 3) * 3
    ctx.fillRect(x, 166, w, 66)
    x += w + 3 + (seed % 2) * 4
  }
  ctx.font = `800 70px ${DISPLAY}`
  ctx.fillText('01', 290, 112)
  return finish(element)
}

/** Штамп станции: двойная рамка и слово. */
export function stampTexture(text: string, color: string): CanvasTexture {
  const [element, ctx] = canvas(320, 160)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 9
  ctx.strokeRect(8, 8, 304, 144)
  ctx.lineWidth = 3
  ctx.strokeRect(22, 22, 276, 116)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = 96
  do {
    ctx.font = `800 ${size}px ${DISPLAY}`
    size -= 6
  } while (ctx.measureText(text).width > 250 && size > 30)
  ctx.fillText(text, 160, 86)
  return finish(element)
}

/** Табличка с номером станции. */
export function signTexture(index: number): CanvasTexture {
  const [element, ctx] = canvas(192, 128)
  ctx.fillStyle = TONE.ink
  ctx.fillRect(0, 0, 192, 128)
  ctx.fillStyle = TONE.signal
  ctx.fillRect(0, 108, 192, 20)
  ctx.fillStyle = '#fbf8f1'
  ctx.font = `800 104px ${DISPLAY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(index).padStart(2, '0'), 96, 60)
  return finish(element)
}

/** Ждёт загрузки акцидентного шрифта, чтобы надписи на канвасе совпали с сайтом. */
export function whenDisplayFontReady(): Promise<unknown> {
  if (!document.fonts?.load) return Promise.resolve()
  return document.fonts.load(`800 64px ${DISPLAY}`, 'ПРИНЯТО 01 MSQ').catch(() => undefined)
}
