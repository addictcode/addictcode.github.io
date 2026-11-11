import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { setProgress } from '../stage/store'
import { applyTheme } from '../stage/theme'

const easeTravel = gsap.parseEase('sine.inOut')

/**
 * Живой режим. ScrollTrigger переводит скролл в прогресс по главам: от него зависят
 * ленты, цвет фона и то, какой экран сейчас виден. Lenis сглаживает колесо мыши.
 * Возвращает функцию очистки.
 */
export function initMotion(): () => void {
  gsap.registerPlugin(ScrollTrigger)
  const root = document.documentElement
  const frames = gsap.utils.toArray<HTMLElement>('[data-chapter]')
  const travel = frames.map(() => 0)

  const publish = () => {
    const p = travel.reduce((sum, t) => sum + easeTravel(t), 0)
    setProgress(p)
    applyTheme(p)
    frames.forEach((frame, i) => {
      const d = p - i
      frame.style.setProperty('--d', d.toFixed(4))
      frame.toggleAttribute('data-on', Math.abs(d) < 0.5)
    })
  }

  const context = gsap.context(() => {
    frames.forEach((frame, i) => {
      if (i === 0) return
      const update = (self: ScrollTrigger) => {
        travel[i] = self.progress
        publish()
      }
      // экран сменяется, пока его секция поднимается от низа окна к верху
      ScrollTrigger.create({ trigger: frame, start: 'top bottom', end: 'top top', onUpdate: update, onRefresh: update })
    })
  })
  publish()
  root.setAttribute('data-live', '')

  let lenis: Lenis | null = null
  const raf = (time: number) => lenis?.raf(time * 1000)
  if (matchMedia('(pointer: fine)').matches) {
    lenis = new Lenis({ lerp: 0.12, anchors: true })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
  }

  return () => {
    gsap.ticker.remove(raf)
    lenis?.destroy()
    context.revert()
    root.removeAttribute('data-live')
    frames.forEach((frame) => {
      frame.style.removeProperty('--d')
      frame.removeAttribute('data-on')
    })
  }
}
