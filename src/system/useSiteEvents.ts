import { useEffect } from 'react'
import { emit } from './bus'
import { CHAPTER_NODE, route } from './graph'
import { getChapter, onViewChange } from './view'

/** области, клик по которым не считается кликом по карте */
const NOT_MAP = '.chapter__body, .topbar, .card, a, button, input, select, label'

/**
 * Превращает действия посетителя в события карты:
 * выбор проекта, клик по ссылке или кнопке, клик по пустому месту карты.
 */
export function useSiteEvents(): void {
  useEffect(() => {
    let previous = getChapter() ?? 0

    const stopView = onViewChange(() => {
      const next = getChapter() ?? 0
      if (next === previous) return
      const path = route(CHAPTER_NODE[previous], CHAPTER_NODE[next])
      previous = next
      emit({ route: path })
    })

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (!target?.closest) return
      const control = target.closest<HTMLElement>('a, button')
      if (control) {
        if (control.dataset.log === 'off') return
        const node = CHAPTER_NODE[getChapter() ?? 0]
        emit({ route: route('client', node), kick: [node] })
        return
      }
      if (!target.closest(NOT_MAP)) emit({ broadcast: true })
    }

    document.addEventListener('click', onClick)
    return () => {
      stopView()
      document.removeEventListener('click', onClick)
    }
  }, [])
}
