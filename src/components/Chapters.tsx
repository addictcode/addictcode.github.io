import { githubUrl, links, telegramUrl } from '../content/profile'
import { LeadDemo } from '../demos/LeadDemo'
import { MonitorDemo } from '../demos/MonitorDemo'
import { useLang } from '../i18n/LangContext'
import { CaseBody, Chapter, ExternalLink } from './Chapter'
import { CrmMock } from './CrmMock'
import { pad2 } from './format'
import { SiteMock } from './SiteMock'

export function SiteChapter() {
  const { t } = useLang()
  const c = t.site
  return (
    <Chapter index={1} kicker={c.kicker} title={c.title} lead={c.lead}>
      <CaseBody data={c} />
      <SiteMock />
    </Chapter>
  )
}

export function BotChapter() {
  const { t } = useLang()
  const c = t.bot
  return (
    <Chapter index={2} kicker={c.kicker} title={c.title} lead={c.lead}>
      <CaseBody data={c} />
      <div className="actions">
        <ExternalLink href={links.vintedRepo}>{t.ui.repo}</ExternalLink>
      </div>
      <MonitorDemo />
    </Chapter>
  )
}

export function CrmChapter() {
  const { t } = useLang()
  const c = t.crm
  return (
    <Chapter index={3} kicker={c.kicker} title={c.title} lead={c.lead}>
      <div className="route">
        <p className="mono route__label">{c.pipelineLabel}</p>
        <ol>
          {c.pipeline.map((step, i) => (
            <li key={step}>
              <span className="mono">{pad2(i + 1)}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <CaseBody data={c} />
      <CrmMock />
    </Chapter>
  )
}

export function RealtimeChapter() {
  const { t } = useLang()
  const c = t.realtime
  return (
    <Chapter index={4} title={c.title} lead={c.lead}>
      <section className="sub" aria-labelledby="pulse-title">
        <h3 id="pulse-title">{c.pulse.title}</h3>
        <p className="kicker mono">{c.pulse.kicker}</p>
        <p className="lead">{c.pulse.lead}</p>
        <picture>
          <source srcSet="/img/pulse-cover.avif" type="image/avif" />
          <img className="shot" src="/img/pulse-cover.webp" width={1200} height={630} loading="lazy" decoding="async" alt={c.pulse.imageAlt} />
        </picture>
        <CaseBody data={c.pulse} />
        <div className="actions">
          <ExternalLink href={links.pulseDemo} variant="solid">
            {t.ui.liveDemo}
          </ExternalLink>
          <ExternalLink href={links.pulseRepo}>{t.ui.repo}</ExternalLink>
        </div>
      </section>
      <section className="sub" aria-labelledby="engine-title">
        <h3 id="engine-title">{c.engine.title}</h3>
        <p className="kicker mono">{c.engine.kicker}</p>
        <p className="lead">{c.engine.lead}</p>
        <CaseBody data={c.engine} />
        <div className="actions">
          <ExternalLink href={links.taskEngineDemo} variant="solid">
            {t.ui.liveDemo}
          </ExternalLink>
          <ExternalLink href={links.taskEngineRepo}>{t.ui.repo}</ExternalLink>
        </div>
      </section>
    </Chapter>
  )
}

const SHOTS = [
  { file: 'tenderradar-in-work', width: 1440, height: 900 },
  { file: 'tenderradar-results', width: 1440, height: 900 },
  { file: 'tenderradar-phone', width: 390, height: 844 },
] as const

export function ParsingChapter() {
  const { t } = useLang()
  const c = t.parsing
  return (
    <Chapter index={5} kicker={c.kicker} title={c.title} lead={c.lead} after={<LeadDemo />}>
      <CaseBody data={c} />
      <div className="shots">
        {SHOTS.map((shot, i) => (
          <figure key={shot.file} className={i === 2 ? 'shots__phone' : ''}>
            <picture>
              <source srcSet={`/img/${shot.file}.avif`} type="image/avif" />
              <img className="shot" src={`/img/${shot.file}.webp`} width={shot.width} height={shot.height} loading="lazy" decoding="async" alt={c.shots[i].alt} />
            </picture>
            <figcaption className="mono">{c.shots[i].caption}</figcaption>
          </figure>
        ))}
      </div>
      <p className="note">{c.shotsNote}</p>
    </Chapter>
  )
}

export function StackChapter() {
  const { t } = useLang()
  const c = t.skills
  return (
    <Chapter index={6} title={c.title} lead={c.lead}>
      <dl className="groups">
        {c.groups.map((group) => (
          <div key={group.name}>
            <dt className="mono">{group.name}</dt>
            <dd>{group.items.join(' · ')}</dd>
          </div>
        ))}
      </dl>
    </Chapter>
  )
}

export function ContactChapter() {
  const { t } = useLang()
  const c = t.contact
  return (
    <Chapter index={7} title={c.title} lead={c.lead}>
      <div className="actions actions--big">
        <ExternalLink href={telegramUrl} variant="solid">
          {t.ui.telegram}
        </ExternalLink>
        <ExternalLink href={githubUrl}>{t.ui.github}</ExternalLink>
      </div>
      <section className="sub" aria-labelledby="take-title">
        <h3 id="take-title">{c.takeTitle}</h3>
        <ul className="plain">
          {c.take.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="sub" aria-labelledby="process-title">
        <h3 id="process-title">{c.processTitle}</h3>
        <ol className="process">
          {c.process.map((step, i) => (
            <li key={step.name}>
              <span className="mono">{pad2(i + 1)}</span>
              <b>{step.name}</b>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>
      <footer className="colophon mono">{c.footer}</footer>
    </Chapter>
  )
}
