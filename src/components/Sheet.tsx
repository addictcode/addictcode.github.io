import type { ReactNode } from 'react'
import { stationIds } from '../content'
import type { Fact, MetaRow } from '../content/types'
import { useLang } from '../i18n/LangContext'
import { ArrowOut } from './Icons'
import { Barcode } from './Barcode'
import { pad2 } from './format'

interface StationProps {
  index: number
  children: ReactNode
  /** блок во всю ширину под листом станции */
  after?: ReactNode
}

/** Секция станции: «окно» со сценой на телефоне и лист-накладная с текстом. */
export function Station({ index, children, after }: StationProps) {
  const id = stationIds[index]
  return (
    <section id={id} className="station" data-station={index} aria-labelledby={`${id}-title`}>
      <div className="station__window" aria-hidden="true" />
      {children}
      {after}
    </section>
  )
}

interface SheetProps {
  index: number
  kicker?: string
  title: string
  lead?: string
  children: ReactNode
}

export function Sheet({ index, kicker, title, lead, children }: SheetProps) {
  const { t } = useLang()
  const id = stationIds[index]
  const station = t.stations[index]
  return (
    <article className="sheet" data-solid>
      <span className="stamp" data-stamp aria-hidden="true">
        {station.stamp}
      </span>
      <header className="sheet__head">
        <p className="sheet__strip mono">
          <span>
            {t.ui.station} {pad2(index)}
          </span>
          <span className="sheet__strip-name">{station.name}</span>
        </p>
        {kicker && <p className="kicker mono">{kicker}</p>}
        <h2 id={`${id}-title`}>{title}</h2>
        {lead && <p className="lead">{lead}</p>}
      </header>
      {children}
      <footer className="sheet__foot" aria-hidden="true">
        <Barcode value={`${id}-${index}`} />
        <span className="mono">
          ST-{pad2(index)} / {id.toUpperCase()}
        </span>
      </footer>
    </article>
  )
}

export function MetaList({ rows }: { rows: MetaRow[] }) {
  return (
    <dl className="meta">
      {rows.map((row) => (
        <div key={row.label} className="meta__row">
          <dt className="mono">{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
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

interface ExternalLinkProps {
  href: string
  children: ReactNode
  variant?: 'line' | 'solid'
}

export function ExternalLink({ href, children, variant = 'line' }: ExternalLinkProps) {
  const { t } = useLang()
  return (
    <a className={`btn btn--${variant}`} href={href} target="_blank" rel="noreferrer">
      <span>{children}</span>
      <span className="btn__icon">
        <ArrowOut />
      </span>
      <span className="visually-hidden">({t.ui.externalHint})</span>
    </a>
  )
}

export function DemoBadge() {
  const { t } = useLang()
  return <span className="badge mono">{t.ui.demo}</span>
}
