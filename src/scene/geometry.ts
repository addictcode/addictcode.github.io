import { BoxGeometry, BufferGeometry, CanvasTexture, EdgesGeometry, Float32BufferAttribute, LinearFilter, SRGBColorSpace } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Box } from './nodeShapes'

/** половина стороны контура, которым узел очерчен на земле */
export const FOOTPRINT = 2.1
const TRACE_WIDTH = 0.07
const TRACE_HEIGHT = 0.02

/** Сплошные грани узла одной геометрией. */
export function solidGeometry(boxes: Box[]): BufferGeometry {
  const parts = boxes.map((b) => new BoxGeometry(b.w, b.h, b.d).translate(b.x, b.y, b.z))
  const merged = mergeGeometries(parts)
  parts.forEach((part) => part.dispose())
  return merged
}

/** Рёбра всех брусков узла и контур на земле: одна геометрия для LineSegments. */
export function edgeGeometry(boxes: Box[]): BufferGeometry {
  const positions: number[] = []
  for (const b of boxes) {
    const solid = new BoxGeometry(b.w, b.h, b.d)
    const edges = new EdgesGeometry(solid)
    const array = edges.getAttribute('position').array
    for (let i = 0; i < array.length; i += 3) positions.push(array[i] + b.x, array[i + 1] + b.y, array[i + 2] + b.z)
    solid.dispose()
    edges.dispose()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return geometry
}

/** Уголки контура узла на земле. Лежат отдельно от узла, чтобы не растягиваться вместе с ним. */
export function footprintGeometry(): BufferGeometry {
  const f = FOOTPRINT
  const tick = 0.5
  const y = 0.02
  const positions: number[] = []
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      positions.push(sx * f, y, sz * f, sx * (f - tick), y, sz * f)
      positions.push(sx * f, y, sz * f, sx * f, y, sz * (f - tick))
    }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return geometry
}

/** Дорожка связи: плоские полоски по ломаной. */
export function traceGeometry(path: [number, number][]): BufferGeometry {
  const parts: BufferGeometry[] = []
  for (let i = 0; i < path.length - 1; i += 1) {
    const [ax, az] = path[i]
    const [bx, bz] = path[i + 1]
    const alongX = Math.abs(bx - ax) > Math.abs(bz - az)
    const length = Math.hypot(bx - ax, bz - az) + TRACE_WIDTH
    parts.push(
      new BoxGeometry(alongX ? length : TRACE_WIDTH, TRACE_HEIGHT, alongX ? TRACE_WIDTH : length).translate(
        (ax + bx) / 2,
        TRACE_HEIGHT / 2,
        (az + bz) / 2,
      ),
    )
  }
  const merged = mergeGeometries(parts)
  parts.forEach((part) => part.dispose())
  return merged
}

export const LABEL_ASPECT = 4

/** Подпись узла: моноширинный текст с маркером, рисуется в canvas. */
export function labelTexture(text: string, font: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512 / LABEL_ASPECT
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.font = `500 52px ${font}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  return texture
}
