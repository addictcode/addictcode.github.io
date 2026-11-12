import { useEffect } from 'react'
import { telegramUrl } from '../content/profile'
import { chapterIds } from '../content'
import { useLang } from '../i18n/LangContext'
import { ArrowLeft } from './Icons'
import { ExternalLink } from './Links'
import { ProjectContent } from './ProjectContent'
import { projectSummary } from './projectSummary'

/** Страница проекта: полный разбор колонкой слева, фигура в форме проекта справа. */
export function ProjectPage({ chapter }: { chapter: number }) {
  const { t } = useLang()
  const id = chapterIds[chapter]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [chapter])

  return (
    <article id={id} className="page" aria-labelledby="project-title">
      <a className="back mono" href="#projects" data-log="off">
        <ArrowLeft />
        {t.ui.back}
      </a>
      <p className="eyebrow mono">
        <b>{t.chapters[chapter]}</b>
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
          <a className="btn btn--ghost" href="#projects" data-log="off">
            <ArrowLeft />
            <span>{t.ui.back}</span>
          </a>
        </div>
      </footer>
    </article>
  )
}
