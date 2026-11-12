import { useEffect, type ReactNode } from 'react'
import { chapterIds } from '../content'
import { githubUrl, profile, telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { CONTACT_CHAPTER, LAB_CHAPTERS, OFFER_CHAPTER, PROJECT_CHAPTERS, REAL_OFFERS, SECTIONS } from '../system/graph'
import { previewChapter, useChapterScroll } from '../system/view'
import { pad2 } from './format'
import { ArrowRight } from './Icons'
import { ExternalLink } from './Links'
import { projectSummary } from './projectSummary'

/** Пока курсор или фокус на строке, камера карты стоит у узла её проекта. */
const preview = (chapter: number) => ({
  onPointerEnter: () => previewChapter(chapter),
  onPointerLeave: () => previewChapter(null),
  onFocus: () => previewChapter(chapter),
  onBlur: () => previewChapter(null),
})

function SectionHead({ id, title, lead }: { id: string; title: string; lead: string }) {
  return (
    <header className="section__head">
      <h2 id={`${id}-title`}>{title}</h2>
      <p className="lead">{lead}</p>
    </header>
  )
}

function Section({ id, title, lead, children }: { id: string; title: string; lead: string; children: ReactNode }) {
  return (
    <section id={id} className="section" data-chapter="" aria-labelledby={`${id}-title`}>
      <SectionHead id={id} title={title} lead={lead} />
      {children}
    </section>
  )
}

/** Главная: первый экран, услуги, проекты, демо-прототипы и контакты. */
export function Home() {
  const { t } = useLang()
  useChapterScroll()

  // переход из шапки с другой страницы: раздел появляется после смены адреса, докручиваем к нему
  useEffect(() => {
    const id = location.hash.slice(1)
    // ждём кадр: страница проекта уже снята, главная разложена по высоте
    const frame = requestAnimationFrame(() => {
      if ((SECTIONS as readonly string[]).includes(id)) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
    })
    return () => {
      cancelAnimationFrame(frame)
      previewChapter(null)
    }
  }, [])

  return (
    <>
      <section id="intro" className="hero" data-chapter="" aria-labelledby="intro-title">
        <div className="hero__body">
          <p className="eyebrow mono">
            <b>{profile.studio}</b>
            <span>{t.hero.role}</span>
          </p>
          <h1 id="intro-title">{t.hero.title}</h1>
          <p className="lead">{t.hero.phrase}</p>
          <div className="actions">
            <ExternalLink href={telegramUrl} variant="solid">
              {t.ui.telegram}
            </ExternalLink>
            <a className="btn btn--ghost" href="#projects" data-log="off">
              <span>{t.hero.cta}</span>
              <ArrowRight />
            </a>
          </div>
        </div>
        <p className="hero__hint mono">{t.hero.hint}</p>
        <a className="hero__scroll mono" href="#services" data-log="off">
          {t.home.scroll}
        </a>
      </section>

      <Section id="services" title={t.home.servicesTitle} lead={t.home.servicesLead}>
        <ol className="rows rows--services">
          {t.offer.items.slice(0, REAL_OFFERS).map((item, i) => {
            const chapter = OFFER_CHAPTER[i]
            return (
              <li key={item.name}>
                <a className="row" href={`#/${chapterIds[chapter]}`} data-log="off" data-offer={chapterIds[chapter]} {...preview(chapter)}>
                  <span className="row__num mono">{pad2(i + 1)}</span>
                  <span className="row__main">
                    <b>{item.name}</b>
                    <span>{item.text}</span>
                  </span>
                  <span className="row__go mono">
                    {t.chapters[chapter]}
                    <ArrowRight />
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
      </Section>

      <section id="projects" className="section section--projects" aria-labelledby="projects-title">
        <SectionHead id="projects" title={t.home.projectsTitle} lead={t.home.projectsLead} />
        {PROJECT_CHAPTERS.map((chapter, i) => {
          const summary = projectSummary(t, chapter)
          return (
            <article key={chapter} className="project" data-chapter={chapter} data-project={chapterIds[chapter]} aria-labelledby={`project-${chapter}`}>
              <p className="project__num mono">
                {pad2(i + 1)}
                <span>{t.chapters[chapter]}</span>
              </p>
              {summary.kicker && <p className="kicker mono">{summary.kicker}</p>}
              <h3 id={`project-${chapter}`}>{summary.title}</h3>
              <p className="lead">{summary.lead}</p>
              <a className="btn btn--solid" href={`#/${chapterIds[chapter]}`} data-log="off">
                <span>{t.home.openCase}</span>
                <ArrowRight />
              </a>
            </article>
          )
        })}
      </section>

      <Section id="demos" title={t.home.demosTitle} lead={t.home.demosLead}>
        <ol className="rows rows--demos">
          {LAB_CHAPTERS.map((chapter, i) => {
            const summary = projectSummary(t, chapter)
            return (
              <li key={chapter}>
                <a className="row" href={`#/${chapterIds[chapter]}`} data-log="off" {...preview(chapter)}>
                  <span className="row__num mono">{pad2(i + 1)}</span>
                  <span className="row__main">
                    <b>
                      {summary.title}
                      <i className="tag mono">{t.lab.demoTag}</i>
                    </b>
                    <span>{summary.lead}</span>
                  </span>
                  <span className="row__go mono">
                    {t.home.openDemo}
                    <ArrowRight />
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
      </Section>

      <section id="contact" className="section section--contact" data-chapter={CONTACT_CHAPTER} aria-labelledby="contact-title">
        <h2 id="contact-title">{t.contact.title}</h2>
        <p className="lead">{t.contact.lead}</p>
        <a className="handle" href={telegramUrl} target="_blank" rel="noreferrer">
          @{profile.telegram}
        </a>
        <div className="actions">
          <ExternalLink href={telegramUrl} variant="solid">
            {t.ui.telegram}
          </ExternalLink>
          <ExternalLink href={githubUrl}>{t.ui.github}</ExternalLink>
        </div>
        <dl className="stackline">
          {t.skills.groups.map((group) => (
            <div key={group.name}>
              <dt className="mono">{group.name}</dt>
              <dd>{group.items.join(' · ')}</dd>
            </div>
          ))}
        </dl>
        <p className="note mono">{t.contact.footer}</p>
      </section>
    </>
  )
}
