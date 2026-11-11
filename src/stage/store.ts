import { useSyncExternalStore } from 'react'

/**
 * Общее состояние линии: непрерывный прогресс p (0 … число глав − 1)
 * и номер активной главы. Сцена читает p в кадре без React,
 * интерфейс подписывается только на смену активной главы.
 */
const state = { p: 0, active: 0 }
const progressListeners = new Set<() => void>()
const activeListeners = new Set<() => void>()

export function getProgress(): number {
  return state.p
}

export function setProgress(p: number): void {
  if (p === state.p) return
  state.p = p
  progressListeners.forEach((fn) => fn())
  setActiveChapter(Math.round(p))
}

export function setActiveChapter(index: number): void {
  if (index === state.active) return
  state.active = index
  activeListeners.forEach((fn) => fn())
}

export function onProgress(fn: () => void): () => void {
  progressListeners.add(fn)
  return () => progressListeners.delete(fn)
}

function subscribeActive(fn: () => void): () => void {
  activeListeners.add(fn)
  return () => activeListeners.delete(fn)
}

export function useActiveChapter(): number {
  return useSyncExternalStore(subscribeActive, () => state.active)
}
