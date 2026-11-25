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



const PREVIEWS: Record<WorkId, () => JSX.Element> = { dealer: Dealer, crm: Crm, tender: Tender }

export function Preview({ id }: { id: WorkId }) {
  const Drawing = PREVIEWS[id]
  return <Drawing />
}
