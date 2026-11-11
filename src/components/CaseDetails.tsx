import type { CaseContent } from '../content/types'

/** Описание кейса: вводная, факты, «ещё» одной строкой и стек. */
export function CaseDetails({ data }: { data: CaseContent }) {
  return (
    <>
      <p className="kicker mono">{data.kicker}</p>
      <p className="lead">{data.lead}</p>
      <dl className="facts">
        {data.facts.map((fact) => (
          <div key={fact.k}>
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
