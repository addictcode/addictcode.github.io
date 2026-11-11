import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { links } from '../content/profile'
import type { CaseContent } from '../content/types'
import { LeadDemo } from '../demos/LeadDemo'
import { MonitorDemo } from '../demos/MonitorDemo'
import { useLang } from '../i18n/LangContext'
import { CrmMock } from './CrmMock'
import { pad2 } from './format'
import { ArrowOut } from './Icons'
import { SiteMock } from './SiteMock'

export type SheetId = 'site' | 'bot' | 'crm' | 'realtime' | 'parsing' | 'contact' | 'lead'

const SheetContext = createContext<(id: SheetId) => void>(() => undefined)

// eslint-disable-next-line react-refresh/only-export-components
export const useOpenSheet = () => useContext(SheetContext)

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

/** Полное описание кейса: факты, «ещё» одной строкой и стек. */
function CaseDetails({ data }: { data: CaseContent }) {
  return (
    <>
      <p className="sheet__kicker mono">{data.kicker}</p>
      <p className="sheet__lead">{data.lead}</p>
      <dl className="facts">
        {data.facts.map((fact) => (
          <div key={fact.k} className="facts__row">
            <dt className="mono">{fact.k}</dt>
            <dd>{fact.text}</dd>
          </div>
        ))}
      </dl>
      {data.more && <p className="more">{data.more}</p>}
      <dl className="stack">
        {data.stack.map((row) => (
          <div key={row.label}>
            <dt className="mono">{row.label}</dt>
            <dd className="mono">{row.value}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

const SHOTS = [
  { file: 'tenderradar-in-work', width: 1440, height: 900 },
  { file: 'tenderradar-results', width: 1440, height: 900 },
  { file: 'tenderradar-phone', width: 390, height: 844 },
] as const

function SheetBody({ id }: { id: SheetId }) {
  const { t } = useLang()
  switch (id) {
    case 'site':
      return (
        <>
          <CaseDetails data={t.site} />
          <SiteMock />
        </>
      )
    case 'bot':
      return (
        <>
          <CaseDetails data={t.bot} />
          <div className="actions">
            <ExternalLink href={links.vintedRepo}>{t.ui.repo}</ExternalLink>
          </div>
          <MonitorDemo />
        </>
      )
    case 'crm':
      return (
        <>
          <CaseDetails data={t.crm} />
          <div className="route">
            <p className="mono route__label">{t.crm.pipelineLabel}</p>
            <ol>
              {t.crm.pipeline.map((step, i) => (
                <li key={step}>
                  <span className="mono">{pad2(i + 1)}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <CrmMock />
        </>
      )
    case 'realtime':
      return (
        <>
          <section className="sub" aria-labelledby="pulse-title">
            <h3 id="pulse-title">{t.realtime.pulse.title}</h3>
            <picture>
              <source srcSet="/img/pulse-cover.avif" type="image/avif" />
              <img className="shot" src="/img/pulse-cover.webp" width={1200} height={630} loading="lazy" decoding="async" alt={t.realtime.pulse.imageAlt} />
            </picture>
            <CaseDetails data={t.realtime.pulse} />
            <div className="actions">
              <ExternalLink href={links.pulseDemo} variant="solid">
                {t.ui.liveDemo}
              </ExternalLink>
              <ExternalLink href={links.pulseRepo}>{t.ui.repo}</ExternalLink>
            </div>
          </section>
          <section className="sub" aria-labelledby="engine-title">
            <h3 id="engine-title">{t.realtime.engine.title}</h3>
            <CaseDetails data={t.realtime.engine} />
            <div className="actions">
              <ExternalLink href={links.taskEngineDemo} variant="solid">
                {t.ui.liveDemo}
              </ExternalLink>
              <ExternalLink href={links.taskEngineRepo}>{t.ui.repo}</ExternalLink>
            </div>
          </section>
        </>
      )
    case 'parsing':
      return (
        <>
          <CaseDetails data={t.parsing} />
          <div className="shots">
            {SHOTS.map((shot, i) => (
              <figure key={shot.file} className={i === 2 ? 'shots__phone' : ''}>
                <picture>
                  <source srcSet={`/img/${shot.file}.avif`} type="image/avif" />
                  <img className="shot" src={`/img/${shot.file}.webp`} width={shot.width} height={shot.height} loading="lazy" decoding="async" alt={t.parsing.shots[i].alt} />
                </picture>
                <figcaption className="mono">{t.parsing.shots[i].caption}</figcaption>
              </figure>
            ))}
          </div>
          <p className="note">{t.parsing.shotsNote}</p>
        </>
      )
    case 'contact':
      return (
        <>
          <section className="sub" aria-labelledby="process-title">
            <h3 id="process-title">{t.contact.processTitle}</h3>
            <ol className="process">
              {t.contact.process.map((step, i) => (
                <li key={step.name}>
                  <span className="mono">{pad2(i + 1)}</span>
                  <b>{step.name}</b>
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="sub" aria-labelledby="skills-title">
            <h3 id="skills-title">{t.skills.title}</h3>
            <dl className="groups">
              {t.skills.groups.map((group) => (
                <div key={group.name}>
                  <dt className="mono">{group.name}</dt>
                  <dd>{group.items.join(' · ')}</dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="note">{t.contact.footer}</p>
        </>
      )
    case 'lead':
      return <LeadDemo />
  }
}

/** Провайдер выезжающей панели: подробности кейсов и демо не удлиняют страницу. */
export function SheetProvider({ children }: { children: ReactNode }) {
  const { t } = useLang()
  const [id, setId] = useState<SheetId | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const open = useCallback((next: SheetId) => setId(next), [])

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (id && !node.open) node.showModal()
    if (!id && node.open) node.close()
  }, [id])

  const title = useMemo(() => {
    if (!id) return ''
    if (id === 'lead') return t.lead.title
    if (id === 'contact') return t.contact.takeTitle
    if (id === 'realtime') return t.realtime.detailsTitle
    return t[id].title
  }, [id, t])

  return (
    <SheetContext.Provider value={open}>
      {children}
      <dialog
        ref={dialog}
        className="sheet"
        aria-labelledby="sheet-title"
        data-solid
        data-lenis-prevent
        data-sheet={id ?? undefined}
        onClose={() => setId(null)}
        onClick={(event) => {
          if (event.target === dialog.current) setId(null)
        }}
      >
        {id && (
          <div className="sheet__inner">
            <header className="sheet__head">
              <h2 id="sheet-title">{title}</h2>
              <button type="button" className="sheet__close mono" onClick={() => setId(null)}>
                {t.ui.close}
              </button>
            </header>
            {id === 'contact' && (
              <ul className="plain">
                {t.contact.take.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            <SheetBody id={id} />
          </div>
        )}
      </dialog>
    </SheetContext.Provider>
  )
}
