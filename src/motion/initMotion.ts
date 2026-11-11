import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { setProgress } from '../stage/store'

const easeTravel = gsap.parseEase('sine.inOut')

/**
 * Привязка к скроллу: ScrollTrigger считает, насколько фигура пересобралась между главами,
 * и проявляет заголовки; Lenis сглаживает колесо мыши. Возвращает функцию очистки.
 */
export function initMotion(): () => void {
  gsap.registerPlugin(ScrollTrigger)
  const context = gsap.context(() => {
    const sections = gsap.utils.toArray<HTMLElement>('[data-chapter]')
    const travel = sections.map(() => 0)
    const publish = () => setProgress(travel.reduce((sum, t) => sum + easeTravel(t), 0))

    sections.forEach((section, i) => {
      if (i === 0) return
      const update = (self: ScrollTrigger) => {
        travel[i] = self.progress
        publish()
      }
      // фигура пересобирается, пока секция главы поднимается от низа экрана к верху
      ScrollTrigger.create({ trigger: section, start: 'top 88%', end: 'top 14%', onUpdate: update, onRefresh: update })
    })

    // номер главы и линия под заголовком проявляются по мере подъёма главы
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
      gsap.fromTo(
        element,
        { '--reveal': 0 },
        { '--reveal': 1, ease: 'none', scrollTrigger: { trigger: element, start: 'top 92%', end: 'top 55%', scrub: true } },
      )
    })
  })

  let lenis: Lenis | null = null
  const raf = (time: number) => lenis?.raf(time * 1000)
  if (matchMedia('(pointer: fine)').matches) {
    lenis = new Lenis({ lerp: 0.13, anchors: true })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
  }

  // листы меняют высоту (картинки, демо, смена языка): пересчитываем точки срабатывания
  let timer = 0
  const observer = new ResizeObserver(() => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => ScrollTrigger.refresh(), 200)
  })
  const main = document.querySelector('main')
  if (main) observer.observe(main)

  return () => {
    window.clearTimeout(timer)
    observer.disconnect()
    gsap.ticker.remove(raf)
    lenis?.destroy()
    context.revert()
  }
}
