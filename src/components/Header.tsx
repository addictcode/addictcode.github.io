import { languages } from '../content'
import { telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { ArrowOut } from './Icons'
import { Logo } from './Logo'

export function Header() {
  const { t, lang, setLang } = useLang()
  return (
    <header className="topbar">
      <a className="topbar__brand" href="#top" aria-label="addictcode">
        <Logo />
      </a>
      <nav className="topbar__nav" aria-label={t.ui.navLabel}>
        <a href="#services">{t.ui.nav.services}</a>
        <a href="#works">{t.ui.nav.works}</a>
        <a href="#terms">{t.ui.nav.terms}</a>
        <a href="#contact">{t.ui.nav.contact}</a>
      </nav>
      <div className="topbar__tools">
        <div className="langs mono" role="group" aria-label={t.ui.langSwitch}>
          {languages.map((code) => (
            <button key={code} type="button" aria-pressed={lang === code} lang={code} onClick={() => setLang(code)}>
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <a className="btn btn--solid btn--small" href={telegramUrl} target="_blank" rel="noreferrer">
          <span className="topbar__cta-long">{t.ui.cta}</span>
          <span className="topbar__cta-short">{t.ui.telegram}</span>
          <ArrowOut />
          <span className="visually-hidden">({t.ui.external})</span>
        </a>
      </div>
    </header>
  )
}
