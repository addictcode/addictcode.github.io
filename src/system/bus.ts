import type { NodeId } from './graph'

/** Событие страницы для карты: действие посетителя, которое видно на связях и узлах. */
export interface SystemEvent {
  /** пакет пройдёт по этим узлам по очереди */
  route?: NodeId[]
  /** узлы, которые отзовутся сразу */
  kick?: NodeId[]
  /** пакеты по всем связям */
  broadcast?: boolean
}

const listeners = new Set<(event: SystemEvent) => void>()

export function emit(event: SystemEvent): void {
  listeners.forEach((fn) => fn(event))
}

export function onSystemEvent(fn: (event: SystemEvent) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
