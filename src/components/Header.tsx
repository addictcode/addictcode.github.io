import { chapterIds, languages } from '../content'
import { telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { clearLog, emit } from '../system/bus'
import { useActiveChapter } from '../system/progress'
import { pad2 } from './format'

export function Header() {
  const { t, lang, setLang } = useLang()
  const active = useActiveChapter()

  const switchLang = (code: typeof lang) => {
    if (code === lang) return
    setLang(code)
    clearLog()
    emit({ kind: 'lang', text: code.toUpperCase(), broadcast: true })
  }

  return (
    <header className="topbar">
      <a className="topbar__brand" href="#intro">
        {t.hero.name}
      </a>
      <nav className="topbar__nav mono" aria-label={t.ui.chapterNav}>
        <ol>
          {t.chapters.map((name, i) => (
            <li key={chapterIds[i]}>
              <a href={`#${chapterIds[i]}`} aria-current={i === active ? 'step' : undefined} data-log="off">
                <span aria-hidden="true">{pad2(i)}</span> {name}
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
