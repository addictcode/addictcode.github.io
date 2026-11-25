import { useLang } from '../i18n/LangContext'
import { ArrowRight } from './Icons'
import { pickService } from './pick'

/** Меню услуг: шесть решений с ценой «от» и сроком. «Выбрать» отмечает услугу в заявке. */
export function Services() {
  const { t } = useLang()
  const s = t.services
  return (
    <section id="services" className="services" aria-labelledby="services-title">
      <header className="section-head services__head">
        <p className="section-head__label mono">{s.label}</p>
        <h2 id="services-title">{s.title}</h2>
        <p className="section-head__lead">{s.lead}</p>
        <p className="services__note">{s.note}</p>
      </header>
      <ol className="services__list">
        {s.items.map((item, i) => (
          <li key={item.name} className="service" data-service={i}>
            <div className="service__top">
              <span className="service__no mono">0{i + 1}</span>
              <h3>{item.name}</h3>
            </div>
            <p className="service__for">{item.forWho}</p>
            <ul className="service__points">
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="service__proof">{item.proof}</p>
            <div className="service__buy">
              <p>
                <b>{item.price}</b>
                <span className="mono">{item.time}</span>
              </p>
              <button type="button" className="btn btn--ghost btn--small" onClick={() => pickService(i)} data-choose={i}>
                <span>{s.choose}</span>
                <ArrowRight />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
