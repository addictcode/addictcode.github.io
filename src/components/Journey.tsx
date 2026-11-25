import { createRef, useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { prefersStatic } from '../motion/env'
import { clamp01, easeInOut, easeOut, seg, track, type Box, type Key } from '../motion/tween'
import { Hero } from './Hero'
import { BoardFace, BotScene, ChipFace, CrmScene, FormFace, NoteFace, SiteScene } from './scenes'
import { Steps } from './Steps'

/** Дискретное состояние карточки: меняется скачками, поэтому живёт в React. */
interface Beat {
  typed: number
  sent: boolean
  ticks: 0 | 1 | 2
  reply: boolean
  copy: boolean
  column: number
  paid: boolean
}

const START: Beat = { typed: 0, sent: false, ticks: 0, reply: false, copy: false, column: 0, paid: false }

/** Окна шагов текста по прогрессу: три шага и итог. */
const STEP_WINDOWS: [number, number][] = [
  [0.11, 0.36],
  [0.37, 0.6],
  [0.61, 0.885],
  [0.89, 1.2],
]
/** Где карточка переходит в следующую колонку доски. */
const COLUMN_AT = [0.72, 0.785, 0.85, 0.915]

function beatAt(p: number, taskLength: number): Beat {
  const column = COLUMN_AT.filter((at) => p >= at).length
  return {
    typed: Math.round(taskLength * seg(p, 0.16, 0.27)),
    sent: p > 0.3,
    ticks: p < 0.45 ? 0 : p < 0.49 ? 1 : 2,
    reply: p > 0.51,
    copy: p > 0.54,
    column,
    paid: column === 4 && p > 0.945,
  }
}

/** как часто меняется слово в плашке первого экрана, мс */
const WORD_EVERY = 2300

const sameBeat = (a: Beat, b: Beat) =>
  a.typed === b.typed && a.sent === b.sent && a.ticks === b.ticks && a.reply === b.reply && a.copy === b.copy && a.column === b.column && a.paid === b.paid

/** Смещение элемента внутри предка без учёта трансформаций. */
function offsetWithin(el: HTMLElement, root: HTMLElement): { x: number; y: number } {
  let x = 0
  let y = 0
  let node: HTMLElement | null = el
  while (node && node !== root) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { x, y }
}

export function Journey() {
  const [still] = useState(prefersStatic)
  return still ? <StillJourney /> : <LiveJourney />
}

/**
 * Живая версия. Секция высотой в шесть экранов, внутри закреплённая сцена.
 * Скролл ведёт одну карточку: слово в заголовке → форма на сайте → уведомление в Telegram → доска CRM до оплаты.
 * Прогресс сглаживается, сами элементы двигаются через transform без React.
 */
function LiveJourney() {
  const { t, lang } = useLang()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const chipRef = useRef<HTMLSpanElement>(null)
  const restRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const siteRef = useRef<HTMLDivElement>(null)
  const botRef = useRef<HTMLDivElement>(null)
  const crmRef = useRef<HTMLDivElement>(null)
  const stepRefs = useMemo(() => [0, 1, 2, 3].map(() => createRef<HTMLElement>()), [])
  const barRefs = useMemo(() => [0, 1, 2].map(() => createRef<HTMLSpanElement>()), [])
  const [beat, setBeat] = useState<Beat>(START)
  const [word, setWord] = useState(0)
  /* слово меняется, только пока посетитель на первом экране */
  const heroIdle = useRef(true)
  const taskLength = t.story.form.taskValue.length
  const wordCount = t.hero.chips.length

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (heroIdle.current) setWord((current) => (current + 1) % wordCount)
    }, WORD_EVERY)
    return () => window.clearInterval(timer)
  }, [wordCount])

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const title = titleRef.current
    const chip = chipRef.current
    const rest = restRef.current
    const card = cardRef.current
    const scenes = [siteRef.current, botRef.current, crmRef.current]
    if (!section || !stage || !title || !chip || !rest || !card || scenes.some((s) => !s)) return
    const [site, bot, crm] = scenes as HTMLDivElement[]
    const faces = Array.from(card.querySelectorAll<HTMLElement>('.face'))
    const drift = stage.querySelector<HTMLElement>('.drift')
    /* подпись над заголовком и подсказка внизу уходят вместе с остальным первым экраном */
    const heroBits = Array.from(stage.querySelectorAll<HTMLElement>('.hero__eyebrow, .hero__cue'))

    let W = 0
    let H = 0
    let u = 1
    const rests = new Map<HTMLElement, { left: number; top: number }>()
    let keys: Key[] = []
    let titleShift = 0
    let current = START

    const slotBox = (slot: HTMLElement, scene: HTMLElement, extra: Partial<Box> = {}): Box => {
      const at = rests.get(scene) ?? { left: 0, top: 0 }
      const off = offsetWithin(slot, scene)
      return { x: at.left + off.x + slot.offsetWidth / 2, y: at.top + off.y + slot.offsetHeight / 2, w: slot.offsetWidth, h: slot.offsetHeight, r: 0, rad: 14 * u, ...extra }
    }

    const chipBox = (): Box => {
      const s = stage.getBoundingClientRect()
      const c = chip.getBoundingClientRect()
      return { x: c.left - s.left + c.width / 2, y: c.top - s.top + c.height / 2 + titleShift, w: c.width, h: c.height, r: -2, rad: c.height / 2 }
    }

    /* Раскладка: где стоит визуальная часть, какой масштаб, где слоты для карточки. */
    const layout = () => {
      W = stage.clientWidth
      H = stage.clientHeight
      const wide = W >= 960
      let vx: number
      let vy: number
      let aw: number
      let ah: number
      if (wide) {
        vx = W * 0.69
        vy = H * 0.55
        aw = W * 0.5
        ah = H * 0.8
      } else {
        const top = 70
        const bottom = H * 0.56
        vx = W / 2
        vy = (top + bottom) / 2
        aw = W * 0.94
        ah = bottom - top
      }
      u = Math.min(aw / 640, ah / 600, 1.25)
      stage.style.setProperty('--u', u.toFixed(4))
      card.style.setProperty('--chip-font', getComputedStyle(chip).fontSize)
      for (const scene of [site, bot, crm]) rests.set(scene, { left: vx - scene.offsetWidth / 2, top: vy - scene.offsetHeight / 2 })

      const form = slotBox(site.querySelector('.slot--form') as HTMLElement, site, { rad: 18 * u })
      const note = slotBox(bot.querySelector('.slot--note') as HTMLElement, bot, { rad: 16 * u })
      const cols = Array.from(crm.querySelectorAll<HTMLElement>('.slot--board')).map((slot) => slotBox(slot, crm, { rad: 10 * u }))
      const hop = (i: number): Box => ({ ...cols[i], arc: 34 * u })
      const center: Box = { x: vx, y: vy, w: 300 * u, h: 228 * u, r: -6, rad: 22 * u }
      const c = chipBox()
      keys = [
        { p: 0, box: c },
        { p: 0.02, box: c },
        { p: 0.1, box: center },
        { p: 0.15, box: form },
        { p: 0.34, box: form },
        { p: 0.43, box: { ...note, r: 2 } },
        { p: 0.47, box: note },
        { p: 0.58, box: note },
        { p: 0.66, box: { ...cols[0], r: -3 } },
        { p: 0.7, box: cols[0] },
        { p: 0.745, box: hop(1) },
        { p: 0.765, box: cols[1] },
        { p: 0.81, box: hop(2) },
        { p: 0.83, box: cols[2] },
        { p: 0.875, box: hop(3) },
        { p: 0.895, box: cols[3] },
        { p: 0.94, box: hop(4) },
        { p: 1, box: cols[4] },
      ]
    }

    const place = (scene: HTMLElement, dy: number, scale: number, opacity: number) => {
      const at = rests.get(scene) ?? { left: 0, top: 0 }
      scene.style.transform = `translate3d(${at.left.toFixed(1)}px, ${(at.top + dy).toFixed(1)}px, 0) scale(${scale.toFixed(4)})`
      scene.style.opacity = opacity.toFixed(3)
      scene.style.visibility = opacity < 0.01 ? 'hidden' : 'visible'
    }

    let pointerX = 0
    let pointerY = 0
    let tiltX = 0
    let tiltY = 0

    const apply = (p: number) => {
      /* первый экран уходит вверх */
      const e = easeInOut(seg(p, 0, 0.08))
      titleShift = e * H * 0.14
      title.style.transform = `translate3d(0, ${(-titleShift).toFixed(1)}px, 0)`
      title.style.opacity = (1 - e).toFixed(3)
      const fade = seg(p, 0, 0.045)
      rest.style.opacity = (1 - fade).toFixed(3)
      rest.style.transform = `translate3d(0, ${(-fade * 30).toFixed(1)}px, 0)`
      rest.style.visibility = fade > 0.99 ? 'hidden' : 'visible'
      heroBits.forEach((bit) => {
        bit.style.opacity = (1 - fade).toFixed(3)
        bit.style.visibility = fade > 0.99 ? 'hidden' : 'visible'
      })
      if (drift) drift.style.opacity = (1 - seg(p, 0, 0.1)).toFixed(3)

      /* карточка: пока не начали листать, вместо неё видно слово в заголовке */
      if (p < 0.12) {
        const c = chipBox()
        keys[0].box = c
        keys[1].box = c
      }
      const flying = p > 0.003
      heroIdle.current = p < 0.002
      chip.style.visibility = flying ? 'hidden' : 'visible'
      card.style.opacity = flying ? '1' : '0'
      const box = track(keys, p)
      card.style.width = `${box.w.toFixed(1)}px`
      card.style.height = `${box.h.toFixed(1)}px`
      card.style.borderRadius = `${box.rad.toFixed(1)}px`
      card.style.transform =
        `translate3d(${(box.x - box.w / 2).toFixed(1)}px, ${(box.y - box.h / 2).toFixed(1)}px, 0) ` +
        `perspective(900px) rotate(${box.r.toFixed(2)}deg) rotateX(${(-tiltY * 7).toFixed(2)}deg) rotateY(${(tiltX * 9).toFixed(2)}deg)`

      const faceOpacity = [
        1 - seg(p, 0.02, 0.06),
        seg(p, 0.04, 0.09) * (1 - seg(p, 0.35, 0.39)),
        seg(p, 0.38, 0.43) * (1 - seg(p, 0.6, 0.64)),
        seg(p, 0.62, 0.66),
      ]
      faces.forEach((face, i) => {
        face.style.opacity = faceOpacity[i].toFixed(3)
        face.style.visibility = faceOpacity[i] < 0.01 ? 'hidden' : 'visible'
      })

      /* декорации */
      const siteIn = easeOut(seg(p, 0.08, 0.15))
      const siteOut = easeInOut(seg(p, 0.34, 0.41))
      place(site, (1 - siteIn) * 60 * u + siteOut * 90 * u, 0.94 + 0.06 * siteIn - 0.04 * siteOut, siteIn * (1 - siteOut))
      const botIn = easeOut(seg(p, 0.37, 0.45))
      const botOut = easeInOut(seg(p, 0.58, 0.64))
      place(bot, (1 - botIn) * H * 0.7, 1 - 0.06 * botOut, Math.min(1, botIn * 3) * (1 - botOut))
      const crmIn = easeOut(seg(p, 0.6, 0.67))
      place(crm, (1 - crmIn) * 50 * u, 0.95 + 0.05 * crmIn, crmIn)

      /* текст шагов и полоска прогресса */
      STEP_WINDOWS.forEach(([a, b], i) => {
        const node = stepRefs[i].current
        if (!node) return
        const enter = easeOut(seg(p, a, a + 0.035))
        const leave = easeInOut(seg(p, b - 0.025, b))
        const opacity = enter * (1 - leave)
        node.style.opacity = opacity.toFixed(3)
        node.style.transform = `translate3d(0, ${((1 - enter) * 28 - leave * 28).toFixed(1)}px, 0)`
        node.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
        node.toggleAttribute('data-on', opacity > 0.5)
      })
      barRefs.forEach((bar, i) => {
        const [a, b] = STEP_WINDOWS[i]
        if (bar.current) bar.current.style.transform = `scaleX(${seg(p, a, b - 0.02).toFixed(4)})`
      })
      const steps = stage.querySelector<HTMLElement>('.steps')
      if (steps) steps.style.opacity = seg(p, 0.08, 0.12).toFixed(3)

      const next = beatAt(p, taskLength)
      if (!sameBeat(next, current)) {
        current = next
        setBeat(next)
      }
    }

    let target = 0
    let shown = -1
    let raf = 0
    const readTarget = () => {
      const r = section.getBoundingClientRect()
      target = clamp01(-r.top / Math.max(1, r.height - window.innerHeight))
    }
    const frame = () => {
      raf = 0
      readTarget()
      shown = shown < 0 ? target : shown + (target - shown) * 0.14
      if (Math.abs(target - shown) < 0.0003) shown = target
      tiltX += (pointerX - tiltX) * 0.08
      tiltY += (pointerY - tiltY) * 0.08
      apply(shown)
      const moving = shown !== target || Math.abs(pointerX - tiltX) > 0.002 || Math.abs(pointerY - tiltY) > 0.002
      if (moving) raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const relayout = () => {
      layout()
      kick()
    }
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointerX = (event.clientX / window.innerWidth) * 2 - 1
      pointerY = (event.clientY / window.innerHeight) * 2 - 1
      kick()
    }

    layout()
    kick()
    document.fonts?.ready.then(relayout)
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', relayout)
    window.addEventListener('pointermove', onPointer, { passive: true })
    /* пока проигрывается появление заголовка, слово-карточка ещё растёт: пересчитываем */
    const settle = window.setTimeout(relayout, 1400)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(settle)
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', relayout)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [lang, taskLength, stepRefs, barRefs])

  return (
    <section ref={sectionRef} className="journey" aria-labelledby="hero-title">
      <span id="top" className="anchor anchor--top" />
      <span id="how" className="anchor anchor--how" />
      <div ref={stageRef} className="journey__stage">
        <Hero word={word} titleRef={titleRef} chipRef={chipRef} restRef={restRef} />
        <div className="journey__visual">
          <SiteScene ref={siteRef} />
          <BotScene ref={botRef} reply={beat.reply} copy={beat.copy} />
          <CrmScene ref={crmRef} column={beat.column} />
          <div ref={cardRef} className="card" aria-hidden="true">
            <ChipFace word={word} />
            <FormFace typed={beat.typed} sent={beat.sent} />
            <NoteFace ticks={beat.ticks} />
            <BoardFace column={beat.column} paid={beat.paid} />
          </div>
        </div>
        <Steps stepRefs={stepRefs} barRefs={barRefs} />
      </div>
    </section>
  )
}

/** Статичная версия: первый экран и три шага друг под другом, карточка стоит в каждой декорации. */
function StillJourney() {
  const { t } = useLang()
  const s = t.story
  const scenes = [
    <SiteScene key="site" className="scene--still" card={<span className="card card--still card--form"><FormFace typed={s.form.taskValue.length} sent /></span>} />,
    <BotScene key="bot" className="scene--still" reply copy card={<span className="card card--still card--note"><NoteFace ticks={2} /></span>} />,
    <CrmScene key="crm" className="scene--still" column={4} card={<span className="card card--still card--board"><BoardFace column={4} paid /></span>} />,
  ]
  return (
    <>
      <section className="journey journey--still" aria-labelledby="hero-title">
        <span id="top" className="anchor" />
        <Hero />
      </section>
      <section id="how" className="still" aria-label={s.label}>
        <p className="steps__label mono">{s.label}</p>
        {s.steps.map((step, i) => (
          <article key={step.name} className="still__step">
            <div className="still__text">
              <p className="step__no mono">
                0{i + 1} · {step.name}
              </p>
              <h2>{step.title}</h2>
              <p className="step__text">{step.text}</p>
              <p className="step__proof">{step.proof}</p>
            </div>
            <div className="still__visual">{scenes[i]}</div>
          </article>
        ))}
        <article className="still__outro">
          <h2>{s.outro.title}</h2>
          <p className="step__text">{s.outro.text}</p>
        </article>
      </section>
    </>
  )
}
