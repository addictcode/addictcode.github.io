import type { ReactNode } from 'react'
import { chapterIds } from '../content'
import { githubUrl, links, profile, telegramUrl } from '../content/profile'
import { LeadDemo } from '../demos/LeadDemo'
import { MonitorDemo } from '../demos/MonitorDemo'
import { useLang } from '../i18n/LangContext'
import { CHAPTER_FOCUS, NODES } from '../system/graph'
import { CaseDetails } from './CaseDetails'
import { CrmMock } from './CrmMock'
import { pad2 } from './format'
import { ArrowRight } from './Icons'
import { ExternalLink } from './Links'
import { SiteMock } from './SiteMock'

interface ChapterProps {
  index: number
  title: string
  children: ReactNode
}

/** Глава: окно на карту (на узком экране) и текст. Камера карты приходит к узлу главы. */
function Chapter({ index, title, children }: ChapterProps) {
  const { t } = useLang()
  const id = chapterIds[index]
  const nodes = CHAPTER_FOCUS[index].map((node) => NODES[node].label).join(' · ')
  return (
    <section id={id} className="chapter" data-chapter={index} aria-labelledby={`${id}-title`}>
      <div className="chapter__window" aria-hidden="true" />
      <div className="chapter__body">
        <p className="eyebrow mono">
          <b>{pad2(index)}</b>
          <span>
            {t.ui.node}: {nodes}
          </span>
        </p>
        <h2 id={`${id}-title`}>{title}</h2>
        {children}
      </div>
    </section>
  )
}

const SHOTS = [
  { file: 'tenderradar-in-work', width: 1440, height: 900 },
  { file: 'tenderradar-results', width: 1440, height: 900 },
  { file: 'tenderradar-phone', width: 390, height: 844 },
] as const

export function Chapters() {
  const { t } = useLang()
  return (
    <>
      <section id="intro" className="chapter chapter--hero" data-chapter={0} aria-labelledby="intro-title">
        <div className="chapter__window" aria-hidden="true" />
        <div className="chapter__body">
          <p className="eyebrow mono">
            <b>{t.hero.name}</b>
            <span>{t.hero.role}</span>
          </p>
          <h1 id="intro-title">{t.hero.title}</h1>
          <p className="lead">{t.hero.phrase}</p>
          <div className="actions">
            <ExternalLink href={telegramUrl} variant="solid">
              {t.ui.telegram}
            </ExternalLink>
            <a className="btn btn--ghost" href="#lead" data-open="lead">
              <span>{t.ui.tryDemo}</span>
              <ArrowRight />
            </a>
          </div>
          <p className="hint mono">
            <span className="hint__wide">{t.hero.hint}</span>
            <span className="hint__narrow">{t.hero.hintTouch}</span>
          </p>
          <p className="note">{t.system.note}</p>
        </div>
      </section>

      <Chapter index={1} title={t.site.title}>
        <CaseDetails data={t.site} />
        <SiteMock />
      </Chapter>

      <Chapter index={2} title={t.bot.title}>
        <CaseDetails data={t.bot} />
        <div className="actions">
          <ExternalLink href={links.vintedRepo}>{t.ui.repo}</ExternalLink>
        </div>
        <MonitorDemo />
      </Chapter>

      <Chapter index={3} title={t.crm.title}>
        <CaseDetails data={t.crm} />
        <div className="route">
          <p className="mono label">{t.crm.pipelineLabel}</p>
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
        <LeadDemo />
      </Chapter>

      <Chapter index={4} title={t.realtime.title}>
        <p className="lead">{t.realtime.lead}</p>
        <section className="sub" aria-labelledby="pulse-title">
          <h3 id="pulse-title">{t.realtime.pulse.title}</h3>
          <CaseDetails data={t.realtime.pulse} />
          <picture>
            <source srcSet="/img/pulse-cover.avif" type="image/avif" />
            <img className="shot" src="/img/pulse-cover.webp" width={1200} height={630} loading="lazy" decoding="async" alt={t.realtime.pulse.imageAlt} />
          </picture>
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
      </Chapter>

      <Chapter index={5} title={t.parsing.title}>
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
      </Chapter>

      <Chapter index={6} title={t.contact.title}>
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
        <section className="sub" aria-labelledby="take-title">
          <h3 id="take-title">{t.contact.takeTitle}</h3>
          <ul className="plain">
            {t.contact.take.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
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
      </Chapter>
    </>
  )
}
