import { chapterIds, languages } from '../content'
import { telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { useActiveChapter } from '../stage/store'
import { pad2 } from './format'

export function Header() {
  const { t, lang, setLang } = useLang()
  return (
    <header className="topbar" data-solid>
      <a className="topbar__brand" href="#intro">
        {t.hero.name}
      </a>
      <div className="topbar__tools">
        <div className="langs mono" role="group" aria-label={t.ui.langSwitch}>
          {languages.map((code) => (
            <button key={code} type="button" aria-pressed={lang === code} lang={code} onClick={() => setLang(code)}>
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

export function ChapterRail() {
  const { t } = useLang()
  const active = useActiveChapter()
  return (
    <nav className="rail" aria-label={t.ui.chapterNav} data-solid>
      <ol>
        {t.chapters.map((name, i) => (
          <li key={chapterIds[i]}>
            <a href={`#${chapterIds[i]}`} aria-current={i === active ? 'step' : undefined}>
              <span className="visually-hidden">{name}</span>
              <span className="rail__no mono" aria-hidden="true">
                {pad2(i)}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
