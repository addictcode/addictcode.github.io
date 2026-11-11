import { useSyncExternalStore } from 'react'
import type { NodeId } from './graph'

/** Вид события: по нему журнал берёт подпись из контента. */
export type LogKind = 'boot' | 'move' | 'click' | 'lang' | 'ping' | 'lead' | 'match' | 'search' | 'monitor'
/** Готовая фраза из контента вместо произвольного текста. */
export type LogTextKey = 'pingText' | 'monitorStart' | 'monitorDone'

export interface SystemEvent {
  kind: LogKind
  text?: string
  textKey?: LogTextKey
  /** пакет пройдёт по этим узлам по очереди */
  route?: NodeId[]
  /** узлы, которые отзовутся сразу */
  kick?: NodeId[]
  /** пакеты по всем связям */
  broadcast?: boolean
  /** не писать в журнал: шаг уже записанного события */
  silent?: boolean
}

export interface LogEntry {
  id: number
  time: number
  kind: LogKind
  text?: string
  textKey?: LogTextKey
}

interface LogState {
  entries: LogEntry[]
  total: number
}

const LOG_SIZE = 5
let log: LogState = { entries: [], total: 0 }
const logListeners = new Set<() => void>()
const eventListeners = new Set<(event: SystemEvent) => void>()

/** Событие страницы: уходит на карту и, если не помечено silent, в журнал. */
export function emit(event: SystemEvent): void {
  eventListeners.forEach((fn) => fn(event))
  if (event.silent) return
  const entry: LogEntry = { id: log.total + 1, time: Date.now(), kind: event.kind, text: event.text, textKey: event.textKey }
  log = { entries: [...log.entries, entry].slice(-LOG_SIZE), total: log.total + 1 }
  logListeners.forEach((fn) => fn())
}

/** Строки журнала зависят от языка, поэтому при его смене журнал начинается заново. Счётчик остаётся. */
export function clearLog(): void {
  log = { entries: [], total: log.total }
  logListeners.forEach((fn) => fn())
}

export function onSystemEvent(fn: (event: SystemEvent) => void): () => void {
  eventListeners.add(fn)
  return () => eventListeners.delete(fn)
}

function subscribeLog(fn: () => void): () => void {
  logListeners.add(fn)
  return () => logListeners.delete(fn)
}

export function useLog(): LogState {
  return useSyncExternalStore(subscribeLog, () => log)
}
