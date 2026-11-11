import type { NodeId } from '../system/graph'

/** Брусок: центр и размеры. Узел карты собирается из таких брусков. */
export interface Box {
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number
}

const box = (x: number, y: number, z: number, w: number, h: number, d: number): Box => ({ x, y, z, w, h, d })
/** брусок, стоящий на высоте `base` */
const standing = (x: number, z: number, w: number, h: number, d: number, base = 0): Box => box(x, base + h / 2, z, w, h, d)

/** высоты 15 модулей CRM: рисунок фиксированный, чтобы кадры совпадали между запусками */
const CRM_HEIGHTS = [1.2, 0.7, 1.7, 0.9, 1.4, 0.6, 1.9, 1.1, 0.8, 1.5, 1.0, 0.5, 1.3, 2.1, 0.9]
const STREAM_HEIGHTS = [0.6, 0.9, 0.7, 1.3, 1.1, 1.7, 1.2, 2.0, 1.6]

function build(id: NodeId): Box[] {
  switch (id) {
    // терминал посетителя: основание и экран
    case 'client':
      return [standing(0, 0.2, 2, 0.12, 1.3), standing(0, -0.45, 1.9, 1.3, 0.08, 0.12), standing(0, 0.45, 1.2, 0.06, 0.5, 0.12)]
    // страницы сайта: три листа один за другим
    case 'site':
      return [
        standing(0, 0, 2.3, 0.1, 1.9),
        standing(-0.15, -0.6, 1.8, 2.0, 0.08, 0.1),
        standing(0.05, 0, 1.8, 1.5, 0.08, 0.1),
        standing(0.25, 0.6, 1.8, 1.0, 0.08, 0.1),
      ]
    // переписка: сообщения стопкой, слева и справа
    case 'bot':
      return [
        box(-0.25, 0.3, 0, 1.5, 0.3, 1),
        box(0.3, 0.82, 0, 1.0, 0.3, 1),
        box(-0.15, 1.34, 0, 1.7, 0.3, 1),
        box(0.4, 1.86, 0, 0.8, 0.3, 1),
        box(-0.3, 2.38, 0, 1.2, 0.3, 1),
      ]
    // 15 модулей на общей плите
    case 'crm':
      return [
        standing(0, 0, 3.5, 0.1, 2.3),
        ...CRM_HEIGHTS.map((h, i) => standing(-1.3 + (i % 5) * 0.65, -0.65 + Math.floor(i / 5) * 0.65, 0.46, h, 0.46, 0.1)),
      ]
    // база: три толстых диска-плиты
    case 'db':
      return [0, 1, 2].map((i) => standing(0, 0, 2.1, 0.5, 2.1, 0.1 + i * 0.68))
    // поток: столбцы графика
    case 'stream':
      return [standing(0, 0, 2.9, 0.1, 1.6), ...STREAM_HEIGHTS.map((h, i) => standing(-1.12 + i * 0.28, 0, 0.14, h, 1.2, 0.1))]
    // очередь: задачи лесенкой
    case 'queue':
      return [0, 1, 2, 3, 4, 5].map((i) => box(-0.6 + i * 0.24, 0.16 + i * 0.32, 0, 1.3, 0.1, 1.1))
    // воронка: плиты сужаются книзу
    case 'parser':
      return [2.4, 1.85, 1.3, 0.75].map((size, i) => box(0, 2.1 - i * 0.6, 0, size, 0.14, size))
    // куб 3×3×3
    case 'llm': {
      const cells: Box[] = []
      for (let ix = -1; ix <= 1; ix += 1)
        for (let iy = 0; iy < 3; iy += 1)
          for (let iz = -1; iz <= 1; iz += 1) cells.push(box(ix * 0.62, 0.45 + iy * 0.62, iz * 0.62, 0.4, 0.4, 0.4))
      return cells
    }
  }
}

export interface NodeShape {
  boxes: Box[]
  height: number
}

export function nodeShape(id: NodeId): NodeShape {
  const boxes = build(id)
  return { boxes, height: Math.max(...boxes.map((b) => b.y + b.h / 2)) }
}
