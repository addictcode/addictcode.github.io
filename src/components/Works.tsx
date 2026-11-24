import { useEffect, useRef, useState } from 'react'
import type { Work, WorkId } from '../content'
import { workLinks } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { ExternalLink } from './ExternalLink'
import { Plus } from './Icons'
import { LayoutSearch } from './LayoutSearch'
import { Preview } from './Previews'

/** Ссылки проекта, если они есть. */
function WorkLinks({ id }: { id: WorkId }) {
  const { t } = useLang()
  const links = (workLinks as Record<string, { code: string; demo?: string }>)[id]
  if (!links) return null
  return (
    <div className="actions">
      {links.demo && (
        <ExternalLink href={links.demo} variant="solid">
          {t.ui.liveDemo}
        </ExternalLink>
      )}
      <ExternalLink href={links.code}>{t.ui.code}</ExternalLink>
    </div>
  )
}

function Row({ work, index, open, onToggle, onHover }: { work: Work; index: number; open: boolean; onToggle: () => void; onHover: (id: WorkId | null) => void }) {
  const { t } = useLang()
  const panelId = `work-${work.id}`
  return (
    <li className={`work${open ? ' is-open' : ''}`} data-work={work.id} onPointerEnter={() => onHover(work.id)} onPointerLeave={() => onHover(null)}>
      <button type="button" className="work__row" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span className="work__no mono">0{index + 1}</span>
        <span className="work__title">{work.title}</span>
        <span className="work__tags mono">{work.tags.join(' · ')}</span>
        <span className="work__toggle" aria-hidden="true">
          <Plus />
        </span>
        <span className="visually-hidden">{open ? t.ui.close : t.ui.open}</span>
      </button>
      <div id={panelId} className="work__panel" hidden={!open}>
        <div className="work__body">
          <div className="work__text">
            <p className="work__meta mono">{work.meta}</p>
            <p className="work__lead">{work.lead}</p>
            <ul className="work__facts">
              {work.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
            <p className="work__stack mono">{work.stack}</p>
            <WorkLinks id={work.id} />
          </div>
          <div className="work__side">
            <Preview id={work.id} />
            {work.id === 'dealer' && <LayoutSearch />}
          </div>
        </div>
      </div>
    </li>
  )
}

/**
 * Работы: короткий список строк. На широком экране за курсором плывёт схема проекта,
 * нажатие раскрывает факты, ссылки и ту же схему.
 */
export function Works() {
  const { t } = useLang()
  const w = t.works
  const [open, setOpen] = useState<WorkId | null>(null)
  const [hover, setHover] = useState<WorkId | null>(null)
  const floatRef = useRef<HTMLDivElement>(null)

  /* схема догоняет курсор и чуть наклоняется по скорости */
  useEffect(() => {
    const node = floatRef.current
    if (!node || !matchMedia('(pointer: fine)').matches) return
    let x = 0
    let y = 0
    let tx = 0
    let ty = 0
    let raf = 0
    const frame = () => {
      raf = 0
      const dx = tx - x
      x += dx * 0.16
      y += (ty - y) * 0.16
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${Math.max(-8, Math.min(8, dx * 0.06)).toFixed(2)}deg)`
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(frame)
    }
    const onMove = (event: PointerEvent) => {
      tx = event.clientX + 28
      ty = event.clientY - 90
      if (!raf) raf = requestAnimationFrame(frame)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  const floating = hover && hover !== open ? hover : null

  return (
    <section id="works" className="works" aria-labelledby="works-title">
      <header className="section-head">
        <p className="section-head__label mono">{w.label}</p>
        <h2 id="works-title">{w.title}</h2>
        <p className="section-head__lead">{w.lead}</p>
      </header>
      <ol className="works__list">
        {w.items.map((work, i) => (
          <Row key={work.id} work={work} index={i} open={open === work.id} onToggle={() => setOpen(open === work.id ? null : work.id)} onHover={setHover} />
        ))}
      </ol>
      <div ref={floatRef} className={`works__float${floating ? ' is-on' : ''}`} aria-hidden="true">
        {w.items.map((work) => (
          <div key={work.id} className={`works__float-item${floating === work.id ? ' is-on' : ''}`}>
            <Preview id={work.id} />
          </div>
        ))}
      </div>
    </section>
  )
}
