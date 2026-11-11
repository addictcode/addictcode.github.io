import { useEffect } from 'react'
import { chapterIds } from '../content'
import { telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { CHAPTER_FOCUS, NODES } from '../system/graph'
import { ArrowLeft } from './Icons'
import { ExternalLink } from './Links'
import { ProjectContent } from './ProjectContent'
import { projectSummary } from './projectSummary'

/** Страница проекта: полный разбор слева, карта с узлом проекта справа. */
export function ProjectPage({ chapter }: { chapter: number }) {
  const { t } = useLang()
  const id = chapterIds[chapter]
  const nodes = CHAPTER_FOCUS[chapter].map((node) => NODES[node].label).join(' · ')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [chapter])

  return (
    <article id={id} className="chapter" aria-labelledby="project-title">
      <div className="chapter__window" aria-hidden="true" />
      <div className="chapter__body">
        <a className="back mono" href="#/" data-log="off">
          <ArrowLeft />
          {t.ui.back}
        </a>
        <p className="eyebrow mono">
          <b>{nodes}</b>
        </p>
        <h1 id="project-title" className="title">
          {projectSummary(t, chapter).title}
        </h1>
        <ProjectContent chapter={chapter} />
        <footer className="sub">
          <p className="lead">{t.contact.lead}</p>
          <div className="actions">
            <ExternalLink href={telegramUrl} variant="solid">
              {t.ui.telegram}
            </ExternalLink>
            <a className="btn btn--ghost" href="#/" data-log="off">
              <ArrowLeft />
              <span>{t.ui.back}</span>
            </a>
          </div>
        </footer>
      </div>
    </article>
  )
}
