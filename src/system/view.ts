import { useEffect, useSyncExternalStore } from 'react'
import { chapterIds } from '../content'

/**
 * Что сейчас показывает карта.
 * route — открыта страница проекта; selected — проект выбран на главной;
 * explore — насколько главная прокручена от вступления к карте (0 … 1).
 * Сцена читает состояние в кадре без React, интерфейс подписывается на изменения.
 */
const FIRST_PROJECT = 1
const LAST_PROJECT = 5

function readRoute(): number | null {
  const index = (chapterIds as readonly string[]).indexOf(location.hash.replace(/^#\//, ''))
  return location.hash.startsWith('#/') && index >= FIRST_PROJECT && index <= LAST_PROJECT ? index : null
}

const state = { route: readRoute(), selected: null as number | null, explore: 0 }
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Глава, на которой стоит камера; null — общий вид. */
export const getChapter = (): number | null => state.route ?? state.selected
export const getExplore = (): number => state.explore
export const onViewChange = subscribe

export function select(chapter: number | null): void {
  if (chapter === state.selected) return
  state.selected = chapter
  notify()
}

window.addEventListener('hashchange', () => {
  const next = readRoute()
  if (next === state.route) return
  // при возврате на главную проект остаётся выбранным на карте
  state.selected = next === null ? state.route : null
  state.route = next
  notify()
})

export const useRoute = (): number | null => useSyncExternalStore(subscribe, () => state.route)
export const useSelected = (): number | null => useSyncExternalStore(subscribe, () => state.selected)
export const useChapter = (): number | null => useSyncExternalStore(subscribe, getChapter)

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
/** выше этой доли выбор проекта сбрасывается: посетитель вернулся ко вступлению */
const KEEP_SELECTION = 0.25

/** Скролл главной → explore: камера опускается к карте, пока блок с услугами входит в экран. */
export function useExploreScroll(target: string): void {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>(target)
    if (!section) return
    let frame = 0
    const measure = () => {
      state.explore = clamp01(1 - section.getBoundingClientRect().top / window.innerHeight)
    }
    const update = () => {
      frame = 0
      measure()
      if (state.explore < KEEP_SELECTION && state.selected !== null) select(null)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    // при входе на главную выбор не сбрасывается: страница ещё подъедет к карте
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      state.explore = 0
    }
  }, [target])
}
