import { useEffect } from 'react'
import { chapterIds } from '../content'
import { githubUrl, profile, telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { FIRST_LAB_CHAPTER, OFFER_CHAPTER } from '../system/graph'
import { select, useExploreScroll, useSelected } from '../system/view'
import { ArrowRight } from './Icons'
import { ExternalLink } from './Links'
import { projectSummary } from './projectSummary'

const CONTACT = 6

/** Карточка выбранного проекта: одна фраза и переход к подробностям. */
function Card({ chapter }: { chapter: number }) {
  const { t } = useLang()
  const summary = projectSummary(t, chapter)
  return (
    <aside className="card" aria-live="polite" data-card={chapterIds[chapter]}>
      <button type="button" className="card__close mono" data-log="off" onClick={() => select(null)}>
        {t.ui.close}
      </button>
      {summary.kicker && <p className="kicker mono">{summary.kicker}</p>}
      <h3>{summary.title}</h3>
      <p>{summary.lead}</p>
      <div className="actions">
        {chapter === CONTACT ? (
          <>
            <ExternalLink href={telegramUrl} variant="solid">
              {t.ui.telegram}
            </ExternalLink>
            <ExternalLink href={githubUrl}>{t.ui.github}</ExternalLink>
          </>
        ) : (
          <a className="btn btn--solid" href={`#/${chapterIds[chapter]}`} data-log="off">
            <span>{t.ui.more}</span>
            <ArrowRight />
          </a>
        )}
      </div>
    </aside>
  )
}

/** Главная: короткое вступление, под ним карта и список того, что можно заказать. */
export function Home() {
  const { t } = useLang()
  const selected = useSelected()
  useExploreScroll('#offer')

  // выбранный проект показывается вместе с картой: блок с картой подъезжает в экран
  useEffect(() => {
    if (selected === null) return
    const section = document.getElementById('offer')
    if (section && Math.abs(section.getBoundingClientRect().top) > window.innerHeight * 0.3) section.scrollIntoView()
  }, [selected])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <section id="intro" className="chapter chapter--hero" aria-labelledby="intro-title">
        <div className="chapter__window" aria-hidden="true" />
        <div className="chapter__body">
          <p className="eyebrow mono">
            <b>{profile.studio}</b>
            <span>{t.hero.role}</span>
          </p>
          <h1 id="intro-title">{t.hero.title}</h1>
          <div className="hero__aside">
            <p className="lead">{t.hero.phrase}</p>
            <div className="actions">
              <ExternalLink href={telegramUrl} variant="solid">
                {t.ui.telegram}
              </ExternalLink>
              <a className="btn btn--ghost" href="#offer" data-log="off">
                <span>{t.hero.cta}</span>
                <ArrowRight />
              </a>
            </div>
            <p className="hint mono">{t.hero.hint}</p>
          </div>
        </div>
      </section>

      <section id="offer" className="chapter chapter--offer" aria-labelledby="offer-title">
        <div className="chapter__window" aria-hidden="true" />
        <div className="chapter__body">
          {selected !== null && <Card chapter={selected} />}
          <header className="offer__head">
            <h2 id="offer-title">{t.offer.title}</h2>
            <p className="note">{t.offer.hint}</p>
          </header>
          <ul className="offer">
            {t.offer.items.map((item, i) => (
              <li key={item.name}>
                <button
                  type="button"
                  aria-pressed={selected === OFFER_CHAPTER[i]}
                  data-log="off"
                  data-offer={chapterIds[OFFER_CHAPTER[i]]}
                  onClick={() => select(OFFER_CHAPTER[i])}
                >
                  <b>
                    {item.name}
                    {OFFER_CHAPTER[i] >= FIRST_LAB_CHAPTER && <i className="mono">{t.lab.demoTag}</i>}
                  </b>
                  <span>{item.text}</span>
                </button>
              </li>
            ))}
          </ul>
          <footer className="foot">
            <a className="handle" href={telegramUrl} target="_blank" rel="noreferrer">
              @{profile.telegram}
            </a>
            <div className="actions">
              <ExternalLink href={telegramUrl} variant="solid">
                {t.ui.telegram}
              </ExternalLink>
              <ExternalLink href={githubUrl}>{t.ui.github}</ExternalLink>
            </div>
            <p className="note">
              <span className="mono">{t.contact.stackLabel}</span> {t.skills.groups.flatMap((group) => group.items).join(' · ')}
            </p>
          </footer>
        </div>
      </section>
    </>
  )
}
