import type { CSSProperties, ReactNode } from 'react'
import { chapterIds } from '../content'
import { githubUrl, links, profile, telegramUrl } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { THEMES, themeVars } from '../stage/theme'
import { pad2 } from './format'
import { ExternalLink, useOpenSheet, type SheetId } from './Sheets'

interface FrameProps {
  index: number
  /** раскладка экрана: где стоит слово и куда наклонена плашка */
  layout: string
  children: ReactNode
}

/** Экран главы. В живом режиме его части закреплены на экране и сменяют друг друга по скроллу. */
function Frame({ index, layout, children }: FrameProps) {
  const id = chapterIds[index]
  return (
    <section
      id={id}
      className={`frame frame--${layout}`}
      data-chapter={index}
      aria-labelledby={`${id}-title`}
      style={themeVars(THEMES[index]) as CSSProperties}
    >
      <Poster index={index} />
      {children}
    </section>
  )
}

/** Статичный кадр лент: вертикальный для телефона, широкий для десктопа. */
function Poster({ index }: { index: number }) {
  const { lang, t } = useLang()
  const base = `/posters/chapter-${index}-${lang}`
  return (
    <picture className="frame__poster">
      <source media="(max-width: 759px)" srcSet={`${base}-m.avif`} type="image/avif" />
      <source media="(max-width: 759px)" srcSet={`${base}-m.webp`} type="image/webp" />
      <source srcSet={`${base}.avif`} type="image/avif" />
      <img
        src={`${base}.webp`}
        alt={index === 0 ? t.ui.stageAlt : ''}
        width={1600}
        height={1000}
        loading={index === 0 ? 'eager' : 'lazy'}
        fetchPriority={index === 0 ? 'high' : 'auto'}
        decoding="async"
      />
    </picture>
  )
}

function Word({ children }: { children: string }) {
  return (
    <p className="frame__word" aria-hidden="true" style={{ '--n': children.length } as CSSProperties}>
      {children}
    </p>
  )
}

interface PlateProps {
  index: number
  title: string
  titleId?: string
  lead?: string
  points?: string[]
  children?: ReactNode
  sub?: boolean
}

function Plate({ index, title, titleId, lead, points, children, sub }: PlateProps) {
  const { t } = useLang()
  const Heading = sub ? 'h3' : 'h2'
  return (
    <article className="plate" data-solid>
      {!sub && (
        <p className="plate__no mono">
          {pad2(index)} / {t.chapters[index]}
        </p>
      )}
      <Heading id={titleId}>{title}</Heading>
      {lead && <p className="plate__lead">{lead}</p>}
      {points && (
        <ul className="plate__points">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
      {children && <div className="plate__actions">{children}</div>}
    </article>
  )
}

function DetailsButton({ sheet, label }: { sheet: SheetId; label?: string }) {
  const { t } = useLang()
  const open = useOpenSheet()
  return (
    <button type="button" className="btn btn--solid" data-open={sheet} onClick={() => open(sheet)}>
      {label ?? t.ui.details}
    </button>
  )
}

export function Frames() {
  const { t } = useLang()
  return (
    <>
      <section
        id="intro"
        className="frame frame--hero"
        data-chapter={0}
        aria-labelledby="intro-title"
        style={themeVars(THEMES[0]) as CSSProperties}
      >
        <Poster index={0} />
        <h1 id="intro-title" className="hero__title">
          {t.hero.lines.map((line) => (
            <span key={line}>{line} </span>
          ))}
        </h1>
        <article className="plate" data-solid>
          <p className="plate__no mono">
            {t.hero.name} / {t.hero.role}
          </p>
          <p className="plate__lead">{t.hero.phrase}</p>
          <div className="plate__actions">
            <ExternalLink href={telegramUrl} variant="solid">
              {t.ui.telegram}
            </ExternalLink>
            <DetailsButton sheet="lead" label={t.ui.tryDemo} />
          </div>
        </article>
        <p className="hero__hint mono">{t.hero.hint}</p>
      </section>

      <Frame index={1} layout="a">
        <Word>{t.words[0]}</Word>
        <Plate index={1} title={t.site.title} titleId="site-title" points={t.site.points}>
          <DetailsButton sheet="site" />
        </Plate>
      </Frame>

      <Frame index={2} layout="b">
        <Word>{t.words[1]}</Word>
        <Plate index={2} title={t.bot.title} titleId="bot-title" points={t.bot.points}>
          <DetailsButton sheet="bot" label={`${t.ui.demo}: ${t.bot.monitor.title}`} />
          <ExternalLink href={links.vintedRepo}>{t.ui.repo}</ExternalLink>
        </Plate>
      </Frame>

      <Frame index={3} layout="c">
        <Word>{t.words[2]}</Word>
        <Plate index={3} title={t.crm.title} titleId="crm-title" points={t.crm.points}>
          <DetailsButton sheet="crm" />
          <DetailsButton sheet="lead" label={t.ui.tryDemo} />
        </Plate>
      </Frame>

      <Frame index={4} layout="d">
        <Word>{t.words[3]}</Word>
        <div className="plates">
          <Plate index={4} title={t.realtime.pulse.title} titleId="realtime-title" lead={t.realtime.pulse.lead} points={t.realtime.pulse.points}>
            <ExternalLink href={links.pulseDemo} variant="solid">
              {t.ui.liveDemo}
            </ExternalLink>
            <DetailsButton sheet="realtime" />
          </Plate>
          <Plate index={4} sub title={t.realtime.engine.title} lead={t.realtime.engine.lead} points={t.realtime.engine.points}>
            <ExternalLink href={links.taskEngineDemo} variant="solid">
              {t.ui.liveDemo}
            </ExternalLink>
            <ExternalLink href={links.taskEngineRepo}>{t.ui.repo}</ExternalLink>
          </Plate>
        </div>
      </Frame>

      <Frame index={5} layout="e">
        <Word>{t.words[4]}</Word>
        <Plate index={5} title={t.parsing.title} titleId="parsing-title" points={t.parsing.points}>
          <DetailsButton sheet="parsing" />
        </Plate>
      </Frame>

      <Frame index={6} layout="f">
        <a
          className="frame__word frame__word--link"
          href={telegramUrl}
          target="_blank"
          rel="noreferrer"
          style={{ '--n': profile.telegram.length + 1 } as CSSProperties}
        >
          @{profile.telegram}
        </a>
        <Plate index={6} title={t.contact.title} titleId="contact-title" lead={t.contact.lead}>
          <ExternalLink href={telegramUrl} variant="solid">
            {t.ui.telegram}
          </ExternalLink>
          <ExternalLink href={githubUrl}>{t.ui.github}</ExternalLink>
          <DetailsButton sheet="contact" label={t.contact.takeTitle} />
        </Plate>
      </Frame>
    </>
  )
}
