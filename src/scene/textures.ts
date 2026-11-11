import { CanvasTexture, LinearFilter, RepeatWrapping } from 'three'

const DISPLAY = '"Unbounded Variable", "Arial Black", sans-serif'
const HEIGHT = 256

/**
 * Маска надписи для ленты: белый текст на прозрачном фоне, ширина холста равна
 * ширине фразы, поэтому текстура повторяется без шва. Возвращает текстуру и её пропорцию.
 */
export function textMask(text: string): { texture: CanvasTexture; aspect: number } {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  let size = 150
  ctx.font = `900 ${size}px ${DISPLAY}`
  let width = ctx.measureText(text).width
  if (width > 4096) {
    size = Math.floor((size * 4096) / width)
    ctx.font = `900 ${size}px ${DISPLAY}`
    width = ctx.measureText(text).width
  }
  canvas.width = Math.max(64, Math.round(width))
  canvas.height = HEIGHT
  ctx.font = `900 ${size}px ${DISPLAY}`
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, HEIGHT / 2 + size * 0.04)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  texture.anisotropy = 4
  return { texture, aspect: canvas.width / HEIGHT }
}

export function whenDisplayFontReady(sample: string): Promise<unknown> {
  if (!document.fonts?.load) return Promise.resolve()
  return document.fonts.load(`900 64px ${DISPLAY}`, sample).catch(() => undefined)
}
