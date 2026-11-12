import { useEffect, useSyncExternalStore } from 'react'
import { chapterIds } from '../content'
import { CHAPTER_SHAPE, CONTACT_CHAPTER, type ShapeId } from './graph'

/**
 * Что сейчас на экране.
 * route — открыта страница проекта; shape — во что собрана скульптура;
 * hero — какая доля первого экрана ещё видна (1 … 0), от неё зависит, где стоит скульптура.
 * Сцена читает состояние в кадре без React, интерфейс подписывается на изменения.
 */
function readRoute(): number | null {
  const index = (chapterIds as readonly string[]).indexOf(location.hash.replace(/^#\//, ''))
  return location.hash.startsWith('#/') && index > 0 && index !== CONTACT_CHAPTER ? index : null
}

const state = { route: readRoute(), shape: 'core' as ShapeId, preview: null as ShapeId | null, hero: 1 }
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const getShape = (): ShapeId => state.preview ?? state.shape
export const getHero = (): number => state.hero
export const isProjectPage = (): boolean => state.route !== null
export const onViewChange = subscribe

/** Посетитель навёл на строку услуги или проекта: фигура показывает его форму, пока курсор на строке. */
export function previewShape(shape: ShapeId | null): void {
  state.preview = shape
}

function setShape(shape: ShapeId): void {
  if (shape === state.shape) return
  state.shape = shape
  notify()
}

window.addEventListener('hashchange', () => {
  const next = readRoute()
  if (next === state.route) return
  state.route = next
  state.preview = null
  if (next !== null) setShape(CHAPTER_SHAPE[next])
  notify()
})
if (state.route !== null) state.shape = CHAPTER_SHAPE[state.route]

export const useRoute = (): number | null => useSyncExternalStore(subscribe, () => state.route)
export const useShape = (): ShapeId => useSyncExternalStore(subscribe, () => state.shape)

/**
 * Главная: скульптура собирается в форму раздела, который сейчас посередине экрана.
 * Раздел помечается атрибутом `data-shape`.
 */
export function useShapeScroll(): void {
  useEffect(() => {
    const hero = document.getElementById('intro')
    let frame = 0
    const update = () => {
      frame = 0
      const middle = window.innerHeight * 0.5
      let found: ShapeId = 'core'
      document.querySelectorAll<HTMLElement>('[data-shape]').forEach((element) => {
        const box = element.getBoundingClientRect()
        if (box.top <= middle && box.bottom > middle) found = element.dataset.shape as ShapeId
      })
      setShape(found)
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
      state.hero = 0
      document.documentElement.style.removeProperty('--hero')
    }
  }, [])
}
