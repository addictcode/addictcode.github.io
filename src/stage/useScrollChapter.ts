import { useEffect } from 'react'
import { setActiveChapter } from './store'

/** Без моушена: активная глава — последняя, чей верх прошёл середину экрана. */
export function useScrollChapter(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'))
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.5
      let active = 0
      sections.forEach((section, i) => {
        if (section.getBoundingClientRect().top < line) active = i
      })
      setActiveChapter(active)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [enabled])
}
