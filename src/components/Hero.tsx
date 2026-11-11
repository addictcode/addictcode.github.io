import { githubUrl, telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { Barcode } from './Barcode'
import { ExternalLink } from './Sheet'

export function Hero() {
  const { t } = useLang()
  const { hero } = t
  return (
    <section id="intake" className="station hero" data-station={0} aria-labelledby="intake-title">
      <div className="hero__body" data-solid>
        <p className="hero__role mono">{hero.role}</p>
        <h1 id="intake-title" className="hero__name">
          <span>{hero.firstName}</span> <span>{hero.lastName}</span>
        </h1>
        <p className="hero__phrase">{hero.phrase}</p>
        <div className="hero__actions">
          <ExternalLink href={telegramUrl} variant="solid">
            {t.ui.telegram}
          </ExternalLink>
          <ExternalLink href={githubUrl}>{t.ui.github}</ExternalLink>
        </div>
      </div>
      <aside className="waybill" data-solid>
        <dl>
          {hero.label.map((row) => (
            <div key={row.label} className="waybill__row">
              <dt className="mono">{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="waybill__code" aria-hidden="true">
          <Barcode value={hero.tracking} height={40} />
          <span className="mono">{hero.tracking}</span>
        </div>
      </aside>
      <p className="hero__hint mono">{hero.hint}</p>
    </section>
  )
}
