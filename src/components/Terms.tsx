import { useLang } from '../i18n/LangContext'
import { Plus, Tick } from './Icons'

/** Как работаем: пять шагов и условия, ниже частые вопросы. */
export function Terms() {
  const { t } = useLang()
  const s = t.terms
  const f = t.faq
  return (
    <>
      <section id="terms" className="terms" aria-labelledby="terms-title">
        <header className="section-head">
          <p className="section-head__label mono">{s.label}</p>
          <h2 id="terms-title">{s.title}</h2>
        </header>
        <ol className="terms__steps">
          {s.steps.map((step, i) => (
            <li key={step.name}>
              <span className="mono">0{i + 1}</span>
              <b>{step.name}</b>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        <ul className="terms__rules">
          {s.rules.map((rule) => (
            <li key={rule}>
              <Tick />
              {rule}
            </li>
          ))}
        </ul>
      </section>
      <section className="faq" aria-labelledby="faq-title">
        <header className="section-head">
          <p className="section-head__label mono">{f.label}</p>
          <h2 id="faq-title">{f.title}</h2>
        </header>
        <div className="faq__list">
          {f.items.map((item) => (
            <details key={item.q} className="faq__item">
              <summary>
                <span>{item.q}</span>
                <span className="faq__icon" aria-hidden="true">
                  <Plus />
                </span>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
