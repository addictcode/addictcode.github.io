import { useEffect, useId, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'

/** пауза после набора, прежде чем поиск попадёт в журнал */
const LOG_DELAY_MS = 700

const LATIN = "qwertyuiop[]asdfghjkl;'zxcvbnm,."
const CYRILLIC = 'йцукенгшщзхъфывапролджэячсмитьбю'

/** «ghbdjl» → «привод»: перевод из английской раскладки в русскую. */
function fixLayout(text: string): string {
  return [...text.toLowerCase()].map((ch) => CYRILLIC[LATIN.indexOf(ch)] ?? ch).join('')
}

/** Схематичный макет каталога с рабочим поиском по неверной раскладке. */
export function SiteMock() {
  const { t } = useLang()
  const { mock } = t.site
  const [query, setQuery] = useState('')
  const inputId = useId()

  const raw = query.trim().toLowerCase()
  const fixed = fixLayout(raw)
  const matched = mock.catalog.filter((name) => name.includes(fixed) || name.includes(raw))
  const wasFixed = raw !== '' && fixed !== raw && matched.some((name) => name.includes(fixed))

  useEffect(() => {
    if (!wasFixed) return
    const timer = window.setTimeout(() => emit({ kind: 'search', text: `${raw} → ${fixed}`, kick: ['site'] }), LOG_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [wasFixed, raw, fixed])

  return (
    <figure className="mock">
      <div className="mock__frame">
        <div className="mock__bar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span className="mock__url" />
        </div>
        <div className="mock__search">
          <label className="mono" htmlFor={inputId}>
            {mock.searchLabel}
          </label>
          <input
            id={inputId}
            type="text"
            value={query}
            placeholder={mock.searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className="mock__hint mono" aria-live="polite">
            {wasFixed ? `${mock.understood}: «${fixed}» · ` : ''}
            {matched.length > 0 ? `${mock.found}: ${matched.length}` : mock.empty}
          </p>
        </div>
        <ul className="mock__grid">
          {mock.catalog.map((name) => (
            <li key={name} className={matched.includes(name) ? '' : 'is-off'}>
              <span className="mock__pic" aria-hidden="true" />
              <span className="mono">{name}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption>{mock.caption}</figcaption>
    </figure>
  )
}
