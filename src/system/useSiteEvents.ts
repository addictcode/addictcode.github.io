import { useEffect } from 'react'
import { emit } from './bus'
import { CHAPTER_NODE, route, routeLabel } from './graph'
import { getActiveChapter, onActiveChapter } from './progress'

const INTERACTIVE = 'a, button, input, select, textarea, label, summary'
/** области, клик по которым не считается кликом по карте */
const NOT_MAP = '.chapter__body, .topbar, .hud'
const LABEL_LIMIT = 36

/**
 * Превращает действия посетителя в события системы:
 * смена главы, клик по ссылке или кнопке, клик по карте.
 */
export function useSiteEvents(): void {
  useEffect(() => {
    emit({ kind: 'boot' })
    let previous = getActiveChapter()

    const stopChapters = onActiveChapter(() => {
      const next = getActiveChapter()
      const path = route(CHAPTER_NODE[previous], CHAPTER_NODE[next])
      previous = next
      emit({ kind: 'move', text: routeLabel(path), route: path })
    })

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (!target?.closest) return
      const control = target.closest<HTMLElement>('a, button')
      if (control) {
        if (control.dataset.log === 'off') return
        const label = (control.dataset.log ?? control.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, LABEL_LIMIT)
        const node = CHAPTER_NODE[getActiveChapter()]
        if (label) emit({ kind: 'click', text: label, route: route('client', node), kick: [node] })
        return
      }
      if (target.closest(INTERACTIVE) || target.closest(NOT_MAP)) return
      emit({ kind: 'ping', textKey: 'pingText', broadcast: true })
    }

    document.addEventListener('click', onClick)
    return () => {
      stopChapters()
      document.removeEventListener('click', onClick)
    }
  }, [])
}
