import { chapterIds, languages } from '../content'
import { telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'
import { FIRST_LAB_CHAPTER } from '../system/graph'
import { useChapter } from '../system/view'

const PROJECTS = [1, 2, 3, 4, 5]

export function Header() {
  const { t, lang, setLang } = useLang()
  const current = useChapter()

  const switchLang = (code: typeof lang) => {
    if (code === lang) return
    setLang(code)
    emit({ broadcast: true })
  }

  return (
    <header className="topbar">
      <a className="topbar__brand" href="#/" data-log="off">
        {t.hero.name}
      </a>
      <nav className="topbar__nav mono" aria-label={t.ui.projects}>
        <ol>
          {PROJECTS.map((chapter) => (
            <li key={chapter}>
              <a href={`#/${chapterIds[chapter]}`} aria-current={chapter === current ? 'page' : undefined} data-log="off">
                {t.chapters[chapter]}
              </a>
            </li>
          ))}
          <li>
            <a href={`#/${chapterIds[FIRST_LAB_CHAPTER]}`} aria-current={current !== null && current >= FIRST_LAB_CHAPTER ? 'page' : undefined} data-log="off">
              {t.ui.demo}
            </a>
          </li>
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
