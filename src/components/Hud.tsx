import { useEffect, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { useLog } from '../system/bus'
import { pad2 } from './format'

const clock = (time: number) => {
  const date = new Date(time)
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

function useSessionSeconds(): number {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const started = Date.now()
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return seconds
}

/**
 * Журнал событий страницы: переходы, клики, шаги демо. Числа настоящие, считаются в браузере.
 * Для скринридеров скрыт: это повтор того, что посетитель и так делает сам.
 */
export function Hud() {
  const { t } = useLang()
  const { entries, total } = useLog()
  const seconds = useSessionSeconds()
  const s = t.system
  return (
    <aside className="hud mono" aria-hidden="true">
      <p className="hud__head">
        <span>{s.hudTitle}</span>
        <span className="hud__live">{s.live}</span>
      </p>
      <ol className="hud__log">
        {entries.map((entry) => (
          <li key={entry.id}>
            <time>{clock(entry.time)}</time>
            <b>{s.log[entry.kind]}</b>
            <span>{entry.textKey ? s.log[entry.textKey] : entry.text}</span>
          </li>
        ))}
      </ol>
      <p className="hud__foot">
        <span>
          {s.session} {pad2(Math.floor(seconds / 60))}:{pad2(seconds % 60)}
        </span>
        <span>
          {s.events} {total}
        </span>
        <span className="hud__hint">{s.pingHint}</span>
      </p>
    </aside>
  )
}
