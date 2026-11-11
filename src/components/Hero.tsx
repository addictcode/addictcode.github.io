import { githubUrl, telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { ExternalLink } from './Chapter'

export function Hero() {
  const { t } = useLang()
  const { hero } = t
  return (
    <section id="intro" className="chapter hero" data-chapter={0} aria-labelledby="intro-title">
      <div className="hero__body" data-solid>
        <p className="hero__who mono">
          {hero.name} <span>/</span> {hero.role}
        </p>
        <h1 id="intro-title">{hero.title}</h1>
        <p className="hero__phrase">{hero.phrase}</p>
        <div className="actions">
          <ExternalLink href={telegramUrl} variant="solid">
            {t.ui.telegram}
          </ExternalLink>
          <ExternalLink href={githubUrl}>{t.ui.github}</ExternalLink>
        </div>
      </div>
      <p className="hero__hint mono">{hero.hint}</p>
    </section>
  )
}
