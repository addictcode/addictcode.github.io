import { useId, useState } from 'react'
import { useLang } from '../i18n/LangContext'

const LATIN = "qwertyuiop[]asdfghjkl;'zxcvbnm,."
const CYRILLIC = 'йцукенгшщзхъфывапролджэячсмитьбю'

/** «ghbdjl» → «привод»: перевод из английской раскладки в русскую. */
function fixLayout(text: string): string {
  return [...text.toLowerCase()].map((ch) => CYRILLIC[LATIN.indexOf(ch)] ?? ch).join('')
}

/** Живой кусочек сайта дилера: поиск, который понимает неверную раскладку. */
export function LayoutSearch() {
  const { t } = useLang()
  const s = t.works.search
  const [query, setQuery] = useState('')
  const id = useId()
  const raw = query.trim().toLowerCase()
  const fixed = fixLayout(raw)
  const matched = raw ? s.catalog.filter((name) => name.includes(fixed) || name.includes(raw)) : []
  const wasFixed = raw !== '' && fixed !== raw && matched.length > 0
  return (
    <div className="lsearch">
      <label className="mono" htmlFor={id}>
        {s.label}
      </label>
      <input id={id} type="text" value={query} placeholder={s.hint} autoComplete="off" spellCheck={false} onChange={(e) => setQuery(e.target.value)} />
      <p className="lsearch__out mono" aria-live="polite">
        {raw === '' ? ' ' : `${wasFixed ? `${s.understood} «${fixed}» · ` : ''}${matched.length > 0 ? `${s.found}: ${matched.join(', ')}` : s.empty}`}
      </p>
    </div>
  )
}
