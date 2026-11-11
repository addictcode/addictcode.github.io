import type { ReactNode } from 'react'
import { chapterIds } from '../content'
import type { CaseContent, Fact, MetaRow } from '../content/types'
import { useLang } from '../i18n/LangContext'
import { pad2 } from './format'
import { ArrowOut } from './Icons'

interface ChapterProps {
  index: number
  kicker?: string
  title: string
  lead?: string
  children?: ReactNode
  /** блок во всю ширину под текстом главы */
  after?: ReactNode
}

/** Глава: «окно» с фигурой на телефоне и колонка текста. */
export function Chapter({ index, kicker, title, lead, children, after }: ChapterProps) {
  const { t } = useLang()
  const id = chapterIds[index]
  return (
    <section id={id} className="chapter" data-chapter={index} aria-labelledby={`${id}-title`}>
      <div className="chapter__window" aria-hidden="true" />
      <div className="chapter__body" data-solid>
        <header className="chapter__head" data-reveal>
          <p className="chapter__no mono">
            <span>{pad2(index)}</span>
            {t.chapters[index]}
          </p>
          <h2 id={`${id}-title`}>{title}</h2>
          {kicker && <p className="kicker mono">{kicker}</p>}
          {lead && <p className="lead">{lead}</p>}
        </header>
        {children}
      </div>
      {after}
    </section>
  )
}

export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="facts">
      {facts.map((fact) => (
        <div key={fact.k} className="facts__row">
          <dt className="mono">{fact.k}</dt>
          <dd>{fact.text}</dd>
        </div>
      ))}
    </dl>
  )
}

export function StackList({ rows }: { rows: MetaRow[] }) {
  return (
    <dl className="stack">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="mono">{row.label}</dt>
          <dd className="mono">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Общая середина кейса: факты, «ещё» одной строкой и стек. */
export function CaseBody({ data }: { data: CaseContent }) {
  return (
    <>
      <FactList facts={data.facts} />
      {data.more && <p className="more">{data.more}</p>}
      <StackList rows={data.stack} />
    </>
  )
}

interface ExternalLinkProps {
  href: string
  children: ReactNode
  variant?: 'ghost' | 'solid'
}

export function ExternalLink({ href, children, variant = 'ghost' }: ExternalLinkProps) {
  const { t } = useLang()
  return (
    <a className={`btn btn--${variant}`} href={href} target="_blank" rel="noreferrer">
      <span>{children}</span>
      <ArrowOut />
      <span className="visually-hidden">({t.ui.externalHint})</span>
    </a>
  )
}

export function DemoBadge() {
  const { t } = useLang()
  return <span className="badge mono">{t.ui.demo}</span>
}
