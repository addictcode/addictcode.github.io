import { links } from '../content/profile'
import { LeadDemo } from '../demos/LeadDemo'
import { LabDemo } from '../lab/LabDemo'
import { FIRST_LAB_CHAPTER } from '../system/graph'
import { MonitorDemo } from '../demos/MonitorDemo'
import { useLang } from '../i18n/LangContext'
import { CaseDetails } from './CaseDetails'
import { CrmMock } from './CrmMock'
import { pad2 } from './format'
import { ExternalLink } from './Links'
import { SiteMock } from './SiteMock'

const SHOTS = [
  { file: 'tenderradar-in-work', width: 1440, height: 900 },
  { file: 'tenderradar-results', width: 1440, height: 900 },
  { file: 'tenderradar-phone', width: 390, height: 844 },
] as const

/** Полный разбор проекта для его страницы: факты, схемы, демо. */
export function ProjectContent({ chapter }: { chapter: number }) {
  const { t } = useLang()
  switch (chapter) {
    case 1:
      return (
        <>
          <CaseDetails data={t.site} />
          <SiteMock />
        </>
      )
    case 2:
      return (
        <>
          <CaseDetails data={t.bot} />
          <div className="actions">
            <ExternalLink href={links.vintedRepo}>{t.ui.repo}</ExternalLink>
          </div>
          <MonitorDemo />
        </>
      )
    case 3:
      return (
        <>
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
        </>
      )
    case 4:
      return (
        <>
          <p className="lead">{t.realtime.lead}</p>
          <section className="sub" aria-labelledby="pulse-title">
            <h2 id="pulse-title">{t.realtime.pulse.title}</h2>
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
            <h2 id="engine-title">{t.realtime.engine.title}</h2>
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
    case 5:
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
    default:
      return chapter >= FIRST_LAB_CHAPTER ? <LabDemo chapter={chapter} /> : null
  }
}
