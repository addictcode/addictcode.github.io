import { BoxGeometry, BufferGeometry, CanvasTexture, EdgesGeometry, Float32BufferAttribute, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Box } from './nodeShapes'

/** половина стороны контура, которым узел очерчен на земле */
export const FOOTPRINT = 2.1

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

/** Плоская полоса шириной `width` по ломаной: дорожка связи или подложка шины под ней. */
export function traceGeometry(points: [number, number][], width: number, height: number): BufferGeometry {
  const parts: BufferGeometry[] = []
  for (let i = 0; i < points.length - 1; i += 1) {
    const [ax, az] = points[i]
    const [bx, bz] = points[i + 1]
    // полоса чуть длиннее отрезка, чтобы скошенные углы смыкались без щелей
    const length = Math.hypot(bx - ax, bz - az) + width
    parts.push(
      new BoxGeometry(length, height, width)
        .rotateY(-Math.atan2(bz - az, bx - ax))
        .translate((ax + bx) / 2, height / 2, (az + bz) / 2),
    )
  }
  const merged = mergeGeometries(parts)
  parts.forEach((part) => part.dispose())
  return merged
}

/** Контактная площадка: квадратная рамка на «полу» вокруг точки. */
export function padGeometry(points: [number, number][], size: number): BufferGeometry {
  const h = size / 2
  const y = 0.03
  const positions: number[] = []
  for (const [x, z] of points) {
    const corners = [
      [x - h, z - h],
      [x + h, z - h],
      [x + h, z + h],
      [x - h, z + h],
    ]
    corners.forEach(([cx, cz], i) => {
      const [nx, nz] = corners[(i + 1) % 4]
      positions.push(cx, y, cz, nx, y, nz)
    })
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return geometry
}

/** Пунктир на «полу»: отрезки между парами точек, по `dash` штрих и пропуск. */
export function dashedGeometry(lines: [[number, number], [number, number]][], dash: number): BufferGeometry {
  const positions: number[] = []
  const y = 0.01
  for (const [[ax, az], [bx, bz]] of lines) {
    const length = Math.hypot(bx - ax, bz - az)
    for (let d = 0; d < length; d += dash * 2) {
      const f0 = d / length
      const f1 = Math.min(1, (d + dash) / length)
      positions.push(ax + (bx - ax) * f0, y, az + (bz - az) * f0, ax + (bx - ax) * f1, y, az + (bz - az) * f1)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return geometry
}

export const LABEL_ASPECT = 4

/** Подпись узла: квадратный маркер и моноширинный текст от левого края, рисуется в canvas. */
export function labelTexture(text: string, font: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512 / LABEL_ASPECT
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(4, canvas.height / 2 - 7, 14, 14)
    ctx.font = `500 50px ${font}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText(text, 34, canvas.height / 2 + 2)
  }
  return canvasTexture(canvas)
}

/** Надпись, напечатанная на «полу»: подписи колонок карты. */
export function floorTextTexture(text: string, font: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024 / FLOOR_TEXT_ASPECT
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.font = `500 76px ${font}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text.toUpperCase(), 8, canvas.height / 2 + 4)
  }
  // надпись видна под острым углом: без мип-карт она рябит
  const texture = canvasTexture(canvas)
  texture.generateMipmaps = true
  texture.minFilter = LinearMipmapLinearFilter
  texture.anisotropy = 8
  return texture
}

export const FLOOR_TEXT_ASPECT = 8

function canvasTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  return texture
}
