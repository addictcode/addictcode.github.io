import type { Ref } from 'react'
import { telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { ExternalLink } from './ExternalLink'
import { Ticks } from './Icons'

interface StepsProps {
  stepRefs?: Ref<HTMLElement>[]
  barRefs?: Ref<HTMLSpanElement>[]
}

/** Текст пути заявки: три шага и итог. В живой версии шаги сменяют друг друга на месте. */
export function Steps({ stepRefs = [], barRefs = [] }: StepsProps) {
  const { t } = useLang()
  const s = t.story
  return (
    <div className="steps">
      <p className="steps__label mono">{s.label}</p>
      <ol className="steps__bar mono" aria-hidden="true">
        {s.steps.map((step, i) => (
          <li key={step.name}>
            <span>
              0{i + 1} {step.name}
            </span>
            <i>
              <span ref={barRefs[i]} />
            </i>
          </li>
        ))}
      </ol>
      <div className="steps__stack">
        {s.steps.map((step, i) => (
          <article key={step.name} className="step" ref={stepRefs[i]} data-step={i}>
            <p className="step__no mono">
              0{i + 1} · {step.name}
            </p>
            <h2>{step.title}</h2>
            <p className="step__text">{step.text}</p>
            <p className="step__proof">
              <Ticks />
              <span>{step.proof}</span>
            </p>
          </article>
        ))}
        <article className="step step--outro" ref={stepRefs[3]} data-step={3}>
          <h2>{s.outro.title}</h2>
          <p className="step__text">{s.outro.text}</p>
          <ExternalLink href={telegramUrl} variant="solid">
            {t.ui.cta}
          </ExternalLink>
        </article>
      </div>
    </div>
  )
}
