import { useEffect, useSyncExternalStore } from 'react'
import { chapterIds } from '../content'
import { CONTACT_CHAPTER } from './graph'

/**
 * Что сейчас показывает карта.
 * route — открыта страница проекта; focus — проект, о котором посетитель читает на главной;
 * preview — проект под курсором (строка списка или узел карты);
 * hero — какая доля первого экрана ещё видна (1 … 0).
 * Сцена читает состояние в кадре без React, интерфейс подписывается на изменения.
 */
function readRoute(): number | null {
  const index = (chapterIds as readonly string[]).indexOf(location.hash.replace(/^#\//, ''))
  return location.hash.startsWith('#/') && index > 0 && index !== CONTACT_CHAPTER ? index : null
}

const state = { route: readRoute(), focus: null as number | null, preview: null as number | null, hero: 1 }
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Глава, на которой стоит камера; null — общий вид карты. */
export const getChapter = (): number | null => state.preview ?? state.route ?? state.focus
export const getHero = (): number => state.hero
export const isProjectPage = (): boolean => state.route !== null
export const onViewChange = subscribe

/** Курсор или фокус на строке проекта или на узле: камера подлетает к нему, пока он там. */
export function previewChapter(chapter: number | null): void {
  if (chapter === state.preview) return
  state.preview = chapter
  notify()
}

function setFocus(chapter: number | null): void {
  if (chapter === state.focus) return
  state.focus = chapter
  notify()
}

window.addEventListener('hashchange', () => {
  const next = readRoute()
  if (next === state.route) return
  state.route = next
  state.preview = null
  notify()
})

export const useRoute = (): number | null => useSyncExternalStore(subscribe, () => state.route)
export const useChapter = (): number | null => useSyncExternalStore(subscribe, getChapter)

/**
 * Главная: камера идёт к проекту, о котором посетитель сейчас читает.
 * Блок помечается атрибутом `data-chapter`; блок без номера (`data-chapter=""`) — общий вид карты.
 */
export function useChapterScroll(): void {
  useEffect(() => {
    const hero = document.getElementById('intro')
    let frame = 0
    const update = () => {
      frame = 0
      const middle = window.innerHeight * 0.5
      let found: number | null = null
      document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((element) => {
        const box = element.getBoundingClientRect()
        if (box.top <= middle && box.bottom > middle) found = element.dataset.chapter ? Number(element.dataset.chapter) : null
      })
      setFocus(found)
      if (hero) {
        const box = hero.getBoundingClientRect()
        state.hero = Math.min(1, Math.max(0, box.bottom / box.height))
        document.documentElement.style.setProperty('--hero', state.hero.toFixed(3))
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      state.focus = null
      state.hero = 0
      document.documentElement.style.removeProperty('--hero')
    }
  }, [])
}
