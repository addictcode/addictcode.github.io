import type { CSSProperties, Ref } from 'react'
import { telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { ArrowDown, Ticks } from './Icons'
import { ExternalLink } from './ExternalLink'

interface HeroProps {
  titleRef?: Ref<HTMLHeadingElement>
  chipRef?: Ref<HTMLSpanElement>
  restRef?: Ref<HTMLDivElement>
}

/**
 * Первый экран. Слово «заявка» в заголовке — это и есть карточка,
 * которая при скролле вылетает из фразы и проходит весь путь.
 */
export function Hero({ titleRef, chipRef, restRef }: HeroProps) {
  const { t, lang } = useLang()
  const h = t.hero
  return (
    <div className="hero" key={lang}>
      <Drift />
      <p className="hero__eyebrow mono reveal" style={{ '--d': '0s' } as CSSProperties}>
        <Ticks /> {h.eyebrow}
      </p>
      <h1 id="hero-title" className="hero__title" ref={titleRef}>
        <span className="line">
          <span className="line__in">{h.before}</span>
        </span>{' '}
        <span className="chip" ref={chipRef}>
          <i className="chip__dot" />
          {h.chip}
          <span className="chip__ring" />
          <span className="chip__ring chip__ring--late" />
        </span>
        <br />
        <span className="line">
          <span className="line__in line__in--late">{h.after}</span>
        </span>
      </h1>
      <div className="hero__rest" ref={restRef}>
        <p className="hero__lead reveal" style={{ '--d': '.7s' } as CSSProperties}>
          {h.lead}
        </p>
        <div className="hero__actions reveal" style={{ '--d': '.82s' } as CSSProperties}>
          <ExternalLink href={telegramUrl} variant="solid">
            {t.ui.cta}
          </ExternalLink>
          <a className="btn btn--ghost" href="#how">
            <span>{h.secondary}</span>
            <ArrowDown />
          </a>
        </div>
      </div>
      <p className="hero__cue mono reveal" style={{ '--d': '1.1s' } as CSSProperties}>
        <span className="hero__cue-line" />
        {h.cue}
      </p>
    </div>
  )
}

/**
 * Фон первого экрана: пустые карточки заявок медленно всплывают и тают.
 * Это заявки, которые теряются у других; текста в них нет.
 */
const DRIFT = [
  { x: 8, y: 22, s: 0.9, r: -8, d: 0 },
  { x: 78, y: 14, s: 1.2, r: 6, d: -6 },
  { x: 62, y: 70, s: 0.8, r: -4, d: -11 },
  { x: 90, y: 58, s: 1, r: 10, d: -3 },
  { x: 30, y: 82, s: 1.1, r: 5, d: -15 },
  { x: 46, y: 8, s: 0.7, r: -12, d: -9 },
  { x: 16, y: 60, s: 0.75, r: 8, d: -18 },
  { x: 70, y: 40, s: 0.65, r: -6, d: -13 },
]

function Drift() {
  return (
    <div className="drift" aria-hidden="true">
      {DRIFT.map((card, i) => (
        <span
          key={i}
          className="drift__card"
          style={{ left: `${card.x}%`, top: `${card.y}%`, '--s': card.s, '--r': `${card.r}deg`, animationDelay: `${card.d}s` } as CSSProperties}
        >
          <i />
          <i />
          <i />
        </span>
      ))}
    </div>
  )
}
