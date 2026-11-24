import type { JSX } from 'react'
import type { WorkId } from '../content'

/*
 * Схемы проектов, нарисованные кодом. Без скриншотов, названий и данных:
 * у коммерческих заказов их показывать нельзя, а остальные рисуем так же для единого вида.
 */

function Dealer() {
  return (
    <div className="pv pv--dealer">
      <span className="pv__bar" />
      <span className="pv__search">
        <b>ghbdjl</b> → привод
      </span>
      <span className="pv__grid">
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} className={i === 1 ? 'is-hit' : ''} />
        ))}
      </span>
    </div>
  )
}

function Crm() {
  const cols = [3, 2, 2, 1]
  return (
    <div className="pv pv--crm">
      {cols.map((count, c) => (
        <span key={c} className="pv__col">
          {Array.from({ length: count }, (_, i) => (
            <i key={i} className={c === 3 && i === 0 ? 'is-hit' : ''} />
          ))}
        </span>
      ))}
    </div>
  )
}

function Vinted() {
  return (
    <div className="pv pv--vinted">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`pv__msg${i === 2 ? ' is-hit' : ''}`}>
          <i />
          <span>
            <b />
            <b />
          </span>
        </span>
      ))}
    </div>
  )
}

function Tender() {
  const scores = [0.9, 0.62, 0.35, 0.78]
  return (
    <div className="pv pv--tender">
      {scores.map((score, i) => (
        <span key={i} className="pv__row">
          <b />
          <i style={{ width: `${score * 100}%` }} className={score > 0.8 ? 'is-hit' : ''} />
        </span>
      ))}
    </div>
  )
}

function Pulse() {
  return (
    <div className="pv pv--pulse">
      <svg viewBox="0 0 200 100" preserveAspectRatio="none">
        <polyline points="0,70 18,64 32,72 50,50 66,58 84,40 100,46 118,30 134,38 152,22 170,30 200,12" />
      </svg>
      <span className="pv__alert" />
    </div>
  )
}

function Engine() {
  const lanes = [
    [0.5, 0.2, 0.15],
    [0.3, 0.4],
    [0.2, 0.15, 0.25, 0.2],
  ]
  return (
    <div className="pv pv--engine">
      {lanes.map((lane, i) => (
        <span key={i} className="pv__lane">
          {lane.map((w, j) => (
            <i key={j} style={{ flexGrow: w }} className={i === 0 && j === 0 ? 'is-hit' : ''} />
          ))}
        </span>
      ))}
    </div>
  )
}

const PREVIEWS: Record<WorkId, () => JSX.Element> = { dealer: Dealer, crm: Crm, vinted: Vinted, tender: Tender, pulse: Pulse, engine: Engine }

export function Preview({ id }: { id: WorkId }) {
  const Drawing = PREVIEWS[id]
  return <Drawing />
}
