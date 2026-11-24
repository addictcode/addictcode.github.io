import { useMemo, useState } from 'react'
import { githubUrl, profile, telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { ArrowOut, Tick } from './Icons'
import { ExternalLink } from './ExternalLink'

/**
 * Последний экран: та же карточка заявки, только настоящая.
 * Кнопка открывает чат в Telegram с готовым текстом; отправляет его сам посетитель.
 */
export function Contact() {
  const { t } = useLang()
  const c = t.contact
  const [needs, setNeeds] = useState<number[]>([])
  const [about, setAbout] = useState('')

  const href = useMemo(() => {
    const lines = [c.message.hello]
    if (needs.length > 0) lines.push(`${c.message.need}: ${needs.map((i) => c.needs[i]).join(', ')}`)
    if (about.trim()) lines.push(`${c.message.about}: ${about.trim()}`)
    return `${telegramUrl}?text=${encodeURIComponent(lines.join('\n'))}`
  }, [needs, about, c])

  const toggle = (index: number) => setNeeds((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort()))

  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <div className="contact__text">
        <p className="section-head__label mono">{c.label}</p>
        <h2 id="contact-title">
          {c.title[0]}{' '}
          <span className="chip chip--static">
            <i className="chip__dot" />
            {c.title[1]}
          </span>
          <br />
          {c.title[2]}
        </h2>
        <p className="section-head__lead">{c.lead}</p>
        <p className="contact__direct">
          <span className="mono">{c.or}</span>
          <a href={telegramUrl} target="_blank" rel="noreferrer">
            @{profile.telegram}
          </a>
          <a href={githubUrl} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </p>
      </div>
      <form className="request" onSubmit={(event) => event.preventDefault()}>
        <p className="request__head">
          <b>{c.card}</b>
          <i className="chip__dot" />
        </p>
        <fieldset>
          <legend className="mono">{c.needsLabel}</legend>
          <div className="request__chips">
            {c.needs.map((need, i) => (
              <button key={need} type="button" className="pick" aria-pressed={needs.includes(i)} onClick={() => toggle(i)} data-need={i}>
                {needs.includes(i) && <Tick />}
                {need}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="request__about">
          <span className="mono">{c.aboutLabel}</span>
          <textarea value={about} rows={3} maxLength={400} placeholder={c.aboutPlaceholder} onChange={(e) => setAbout(e.target.value)} />
        </label>
        <a className="btn btn--solid btn--wide" href={href} target="_blank" rel="noreferrer" data-send>
          <span>{c.send}</span>
          <ArrowOut />
          <span className="visually-hidden">({t.ui.external})</span>
        </a>
        <p className="request__hint">{c.hint}</p>
      </form>
    </section>
  )
}

export function Footer() {
  const { t } = useLang()
  return (
    <footer className="footer">
      <p className="footer__name">
        {profile.studio}
        <span>{t.footer}</span>
      </p>
      <div className="actions">
        <ExternalLink href={telegramUrl} variant="text">
          Telegram
        </ExternalLink>
        <ExternalLink href={githubUrl} variant="text">
          GitHub
        </ExternalLink>
      </div>
    </footer>
  )
}
