import { forwardRef, type ReactNode } from 'react'
import { useLang } from '../i18n/LangContext'
import { Tick, Ticks } from './Icons'

/*
 * Декорации пути заявки: окно сайта, телефон с Telegram и доска CRM.
 * Всё нарисовано кодом, размеры в единицах --u (1 = макет 640 px шириной).
 * В живой версии карточка заявки летает поверх декораций отдельно,
 * в статичной её лицо стоит прямо в слоте декорации.
 */

/* ───── Лица карточки ───── */

export function ChipFace({ word }: { word: number }) {
  const { t } = useLang()
  return (
    <span className="face face--chip">
      <i className="chip__dot" />
      {t.hero.chips[word]}
    </span>
  )
}

interface FormFaceProps {
  /** сколько букв задачи уже «напечатано» */
  typed: number
  sent: boolean
}

export function FormFace({ typed, sent }: FormFaceProps) {
  const { t } = useLang()
  const f = t.story.form
  const done = typed >= f.taskValue.length
  return (
    <span className="face face--form">
      <span className="face__head">
        <b>{f.title}</b>
        <i className="chip__dot" />
      </span>
      <span className="field">
        <span className="field__label">{f.name}</span>
        <span className="field__value">{f.nameValue}</span>
      </span>
      <span className="field">
        <span className="field__label">{f.task}</span>
        <span className="field__value">
          {f.taskValue.slice(0, typed)}
          {!done && <i className="caret" />}
        </span>
      </span>
      <span className="field">
        <span className="field__label">{f.source}</span>
        <span className="field__value">{f.sourceValue}</span>
      </span>
      <span className={`face__send${sent ? ' is-sent' : ''}`}>
        {sent ? (
          <>
            {f.sent} <Tick />
          </>
        ) : (
          f.send
        )}
      </span>
    </span>
  )
}

export function NoteFace({ ticks }: { ticks: 0 | 1 | 2 }) {
  const { t } = useLang()
  const n = t.story.note
  return (
    <span className="face face--note">
      <span className="face__head">
        <b>{n.chat}</b>
        <span className="face__time">{n.now}</span>
      </span>
      <span className="note__title">{n.title}</span>
      <span className="note__line">
        {t.story.form.task}: {t.story.form.taskValue}
      </span>
      <span className="note__line">
        {t.story.form.source}: {t.story.form.sourceValue}
      </span>
      <span className={`note__ticks${ticks === 2 ? ' is-read' : ''}`}>{ticks === 2 ? <Ticks /> : ticks === 1 ? <Tick /> : null}</span>
    </span>
  )
}

export function BoardFace({ column, paid }: { column: number; paid: boolean }) {
  const { t } = useLang()
  const b = t.story.board
  return (
    <span className="face face--board">
      <span className="board__task">{t.story.form.taskValue}</span>
      <span className={`status${paid ? ' is-paid' : ''}`}>
        {paid ? (
          <>
            {b.paid} <Tick />
          </>
        ) : (
          b.columns[column]
        )}
      </span>
    </span>
  )
}

/* ───── Декорации ───── */

interface SceneProps {
  /** лицо карточки для статичной версии; в живой версии слот пустой */
  card?: ReactNode
  className?: string
}

export const SiteScene = forwardRef<HTMLDivElement, SceneProps>(function SiteScene({ card, className = '' }, ref) {
  return (
    <div ref={ref} className={`scene scene--site ${className}`} aria-hidden="true">
      <div className="browser">
        <div className="browser__bar">
          <i />
          <i />
          <i />
          <span className="browser__url" />
        </div>
        <div className="browser__body">
          <div className="site__copy">
            <span className="sk sk--title" />
            <span className="sk sk--title sk--short" />
            <span className="sk" />
            <span className="sk sk--short" />
            <div className="site__tiles">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="tile" />
              ))}
            </div>
          </div>
          <div className="slot slot--form">{card}</div>
        </div>
      </div>
    </div>
  )
})

interface BotSceneProps extends SceneProps {
  reply: boolean
  copy: boolean
}

export const BotScene = forwardRef<HTMLDivElement, BotSceneProps>(function BotScene({ card, reply, copy, className = '' }, ref) {
  const { t } = useLang()
  const n = t.story.note
  return (
    <div ref={ref} className={`scene scene--bot ${className}`} aria-hidden="true">
      <div className="phone">
        <div className="phone__head">
          <span className="phone__avatar">
            <Ticks />
          </span>
          <span>
            <b>{n.chat}</b>
            <small>{n.bot}</small>
          </span>
        </div>
        <div className="phone__chat">
          <div className="slot slot--note">{card}</div>
          <p className={`bubble${reply ? ' is-on' : ''}`}>{n.reply}</p>
          <p className={`copy${copy ? ' is-on' : ''}`}>
            <Tick /> {n.copy}
          </p>
        </div>
      </div>
    </div>
  )
})

export const CrmScene = forwardRef<HTMLDivElement, SceneProps & { column?: number }>(function CrmScene({ card, column = 4, className = '' }, ref) {
  const { t } = useLang()
  const b = t.story.board
  /* серые заглушки других заказов: сколько в каждой колонке */
  const ghosts = [2, 1, 2, 1, 1]
  return (
    <div ref={ref} className={`scene scene--crm ${className}`} aria-hidden="true">
      <div className="board">
        <p className="board__title">{b.title}</p>
        <div className="board__cols">
          {b.columns.map((name, i) => (
            <div key={name} className={`board__col${i === column ? ' is-here' : ''}`}>
              <span className="board__name">{name}</span>
              <div className="slot slot--board">{i === column ? card : null}</div>
              {Array.from({ length: ghosts[i] }, (_, g) => (
                <span key={g} className="ghost" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
