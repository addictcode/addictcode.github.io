import { links, githubUrl, telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { LeadDemo } from '../demos/LeadDemo'
import { MonitorDemo } from '../demos/MonitorDemo'
import { CrmMock } from './CrmMock'
import { ExternalLink, FactList, MetaList, pad2, Sheet, Station } from './Sheet'
import { SiteMock } from './SiteMock'

export function SiteStation() {
  const { t } = useLang()
  const c = t.site
  return (
    <Station index={1}>
      <Sheet index={1} kicker={c.kicker} title={c.title} lead={c.lead}>
        <MetaList rows={c.meta} />
        <FactList facts={c.facts} />
        <SiteMock />
      </Sheet>
    </Station>
  )
}

export function BotStation() {
  const { t } = useLang()
  const c = t.bot
  return (
    <Station index={2}>
      <Sheet index={2} kicker={c.kicker} title={c.title} lead={c.lead}>
        <MetaList rows={c.meta} />
        <FactList facts={c.facts} />
        <div className="actions">
          <ExternalLink href={links.vintedRepo}>{t.ui.repo}</ExternalLink>
        </div>
        <MonitorDemo />
      </Sheet>
    </Station>
  )
}

export function CrmStation() {
  const { t } = useLang()
  const c = t.crm
  return (
    <Station index={3}>
      <Sheet index={3} kicker={c.kicker} title={c.title} lead={c.lead}>
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
        <MetaList rows={c.meta} />
        <FactList facts={c.facts} />
        <CrmMock />
      </Sheet>
    </Station>
  )
}

export function RealtimeStation() {
  const { t } = useLang()
  const c = t.realtime
  return (
    <Station index={4}>
      <Sheet index={4} title={c.title} lead={c.lead}>
        <section className="sub" aria-labelledby="pulse-title">
          <p className="kicker mono">{c.pulse.kicker}</p>
          <h3 id="pulse-title">{c.pulse.title}</h3>
          <p className="lead">{c.pulse.lead}</p>
          <picture>
            <source srcSet="/img/pulse-cover.avif" type="image/avif" />
            <img
              className="shot"
              src="/img/pulse-cover.webp"
              width={1200}
              height={630}
              loading="lazy"
              decoding="async"
              alt={c.pulse.imageAlt}
            />
          </picture>
          <MetaList rows={c.pulse.meta} />
          <FactList facts={c.pulse.facts} />
          <div className="actions">
            <ExternalLink href={links.pulseDemo} variant="solid">
              {t.ui.liveDemo}
            </ExternalLink>
            <ExternalLink href={links.pulseRepo}>{t.ui.repo}</ExternalLink>
          </div>
        </section>
        <section className="sub" aria-labelledby="engine-title">
          <p className="kicker mono">{c.engine.kicker}</p>
          <h3 id="engine-title">{c.engine.title}</h3>
          <p className="lead">{c.engine.lead}</p>
          <MetaList rows={c.engine.meta} />
          <FactList facts={c.engine.facts} />
          <div className="actions">
            <ExternalLink href={links.taskEngineDemo} variant="solid">
              {t.ui.liveDemo}
            </ExternalLink>
            <ExternalLink href={links.taskEngineRepo}>{t.ui.repo}</ExternalLink>
          </div>
        </section>
      </Sheet>
    </Station>
  )
}

const SHOTS = [
  { file: 'tenderradar-in-work', width: 1440, height: 900 },
  { file: 'tenderradar-results', width: 1440, height: 900 },
  { file: 'tenderradar-phone', width: 390, height: 844 },
] as const

export function ParsingStation() {
  const { t } = useLang()
  const c = t.parsing
  return (
    <Station index={5} after={<LeadDemo />}>
      <Sheet index={5} kicker={c.kicker} title={c.title} lead={c.lead}>
        <MetaList rows={c.meta} />
        <FactList facts={c.facts} />
        <div className="shots">
          {SHOTS.map((shot, i) => (
            <figure key={shot.file} className={i === 2 ? 'shots__phone' : ''}>
              <picture>
                <source srcSet={`/img/${shot.file}.avif`} type="image/avif" />
                <img
                  className="shot"
                  src={`/img/${shot.file}.webp`}
                  width={shot.width}
                  height={shot.height}
                  loading="lazy"
                  decoding="async"
                  alt={c.shots[i].alt}
                />
              </picture>
              <figcaption className="mono">{c.shots[i].caption}</figcaption>
            </figure>
          ))}
        </div>
        <p className="note note--mark">{c.shotsNote}</p>
      </Sheet>
    </Station>
  )
}

export function SortingStation() {
  const { t } = useLang()
  const c = t.skills
  return (
    <Station index={6}>
      <Sheet index={6} title={c.title} lead={c.lead}>
        <ul className="crates">
          {c.containers.map((crate) => (
            <li key={crate.code}>
              <p className="crates__tag mono">
                <span>
                  {c.containerLabel} {crate.code}
                </span>
                <b>{crate.name}</b>
              </p>
              <ul>
                {crate.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Sheet>
    </Station>
  )
}

export function DispatchStation() {
  const { t } = useLang()
  const c = t.delivery
  return (
    <Station index={7}>
      <Sheet index={7} title={c.title} lead={c.lead}>
        <section className="sub" aria-labelledby="take-title">
          <h3 id="take-title">{c.takeTitle}</h3>
          <ul className="ticks">
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
        <section className="sub contacts" aria-labelledby="contact-title">
          <h3 id="contact-title">{c.contactTitle}</h3>
          <div className="contacts__row">
            <ExternalLink href={telegramUrl} variant="solid">
              {t.ui.telegram}
            </ExternalLink>
            <span className="note">{c.telegramNote}</span>
          </div>
          <div className="contacts__row">
            <ExternalLink href={githubUrl}>{t.ui.github}</ExternalLink>
            <span className="note">{c.githubNote}</span>
          </div>
        </section>
      </Sheet>
      <footer className="colophon mono" data-solid>
        {c.footer}
      </footer>
    </Station>
  )
}
