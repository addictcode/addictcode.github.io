import { useEffect, useSyncExternalStore } from 'react'

/**
 * Положение на странице в главах: непрерывное p (0 … число глав − 1) и номер активной главы.
 * Сцена читает p в кадре без React, интерфейс подписывается только на смену главы.
 */
const state = { p: 0, active: 0 }
const activeListeners = new Set<() => void>()

export const getProgress = (): number => state.p
export const getActiveChapter = (): number => state.active

function setProgress(p: number): void {
  state.p = p
  const active = Math.round(p)
  if (active === state.active) return
  state.active = active
  activeListeners.forEach((fn) => fn())
}

export function onActiveChapter(fn: () => void): () => void {
  activeListeners.add(fn)
  return () => activeListeners.delete(fn)
}

export function useActiveChapter(): number {
  return useSyncExternalStore(onActiveChapter, getActiveChapter)
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number) => value * value * (3 - 2 * value)

/** доля высоты окна: линия, по которой определяется текущая глава */
const READ_LINE = 0.45
/** доля высоты окна, за которую камера переходит к следующему узлу */
const TRAVEL = 0.5

/**
 * Скролл → p. Камера стоит на узле, пока глава читается,
 * и едет к следующему, когда его глава подходит к линии чтения.
 */
export function useScrollProgress(): void {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'))
    let frame = 0
    const update = () => {
      frame = 0
      const height = window.innerHeight
      const line = height * READ_LINE
      const tops = sections.map((section) => section.getBoundingClientRect().top)
      let index = 0
      tops.forEach((top, i) => {
        if (top <= line) index = i
      })
      let p = index
      if (index < sections.length - 1) {
        const span = height * TRAVEL
        p += smooth(clamp01((line - (tops[index + 1] - span)) / span))
      }
      setProgress(p)
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
    }
  }, [])
}
