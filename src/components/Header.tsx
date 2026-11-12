import { languages } from '../content'
import { profile, telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'
import { SECTIONS } from '../system/graph'

export function Header() {
  const { t, lang, setLang } = useLang()

  const switchLang = (code: typeof lang) => {
    if (code === lang) return
    setLang(code)
    emit({})
  }

  return (
    <header className="topbar">
      <a className="topbar__brand" href="#/" data-log="off">
        {profile.studio}
      </a>
      <nav className="topbar__nav" aria-label={t.ui.chapterNav}>
        <ol>
          {SECTIONS.map((id) => (
            <li key={id}>
              <a href={`#${id}`} data-log="off">
                {t.home.nav[id]}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="topbar__tools">
        <div className="langs mono" role="group" aria-label={t.ui.langSwitch}>
          {languages.map((code) => (
            <button key={code} type="button" aria-pressed={lang === code} lang={code} data-log="off" onClick={() => switchLang(code)}>
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <a className="topbar__tg" href={telegramUrl} target="_blank" rel="noreferrer">
          Telegram
        </a>
      </div>
    </header>
  )
}
