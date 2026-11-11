import type { NodeId } from './graph'

/**
 * Кнопки поверх узлов карты. Интерфейс регистрирует элемент,
 * сцена каждый кадр ставит его на место узла на экране.
 */
const elements = new Map<NodeId, HTMLElement>()

export function registerHotspot(id: NodeId, element: HTMLElement | null): void {
  if (element) elements.set(id, element)
  else elements.delete(id)
}

export function placeHotspot(id: NodeId, x: number, y: number, visible: boolean): void {
  const element = elements.get(id)
  if (!element) return
  element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
  element.style.visibility = visible ? 'visible' : 'hidden'
}
