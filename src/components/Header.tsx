import { languages, STATION_COUNT, stationIds } from '../content'
import { telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { useActiveStation } from '../stage/store'
import { PlaneIcon } from './Icons'
import { pad2 } from './format'

export function Header() {
  const { t, lang, setLang } = useLang()
  const active = useActiveStation()
  return (
    <header className="topbar" data-solid>
      <a className="topbar__brand mono" href="#intake">
        {t.ui.brand}
      </a>
      <p className="topbar__ticker mono" aria-live="off">
        <span className="topbar__no">
          {pad2(active)}/{pad2(STATION_COUNT - 1)}
        </span>
        <span>{t.stations[active].name}</span>
      </p>
      <div className="topbar__tools">
        <div className="langs" role="group" aria-label={t.ui.langSwitch}>
          {languages.map((code) => (
            <button
              key={code}
              type="button"
              className="langs__btn mono"
              aria-pressed={lang === code}
              lang={code}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <a className="topbar__tg mono" href={telegramUrl} target="_blank" rel="noreferrer">
          <PlaneIcon />
          <span>Telegram</span>
        </a>
      </div>
    </header>
  )
}

export function StationRail() {
  const { t } = useLang()
  const active = useActiveStation()
  return (
    <nav className="rail" aria-label={t.ui.stationNav} data-solid>
      <ol>
        {t.stations.map((station, i) => (
          <li key={stationIds[i]}>
            <a href={`#${stationIds[i]}`} aria-current={i === active ? 'step' : undefined}>
              <span className="rail__name mono">{station.name}</span>
              <span className="rail__no mono">{pad2(i)}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
