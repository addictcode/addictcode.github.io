import { useEffect, useRef, useState, type FormEvent } from 'react'
import { leadFirstNumber, leadWeekSeed } from '../content/demoData'
import { useLang } from '../i18n/LangContext'
import { ArrowRight } from '../components/Icons'
import { DemoBadge } from '../components/Links'
import { emit } from '../system/bus'
import type { NodeId } from '../system/graph'

interface Lead {
  no: number
  name: string
  need: number
  budget: number
}

/** 0 — ждём форму, 1 — бот, 2 — CRM, 3 — дашборд, 4 — линия пройдена */
type Stage = 0 | 1 | 2 | 3 | 4

const STEP_MS = 850
/** путь заявки по карте: по одному отрезку на шаг демо */
const LEAD_ROUTE: NodeId[][] = [
  ['client', 'site', 'bot'],
  ['bot', 'crm'],
  ['crm', 'stream'],
]
const todayIndex = (new Date().getDay() + 6) % 7

/** Заявка из формы проходит бота, CRM и дашборд. Всё в памяти страницы. */
export function LeadDemo() {
  const { t } = useLang()
  const d = t.lead
  const [leads, setLeads] = useState<Lead[]>([])
  const [stage, setStage] = useState<Stage>(0)
  const [name, setName] = useState('')
  const [need, setNeed] = useState(0)
  const [budget, setBudget] = useState(1)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || (stage > 0 && stage < 4)) return
    setLeads((prev) => [...prev, { no: leadFirstNumber + prev.length, name: name.trim(), need, budget }])
    setStage(1)
    emit({ route: LEAD_ROUTE[0] })
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const step = reduced ? 0 : STEP_MS
    timers.current = ([2, 3, 4] as Stage[]).map((next, i) =>
      window.setTimeout(() => {
        setStage(next)
        if (LEAD_ROUTE[i + 1]) emit({ route: LEAD_ROUTE[i + 1] })
      }, step * (i + 1)),
    )
  }

  const busy = stage > 0 && stage < 4
  const last = leads[leads.length - 1]
  // пока заявка идёт по линии, следующие панели её ещё не видят
  const inBot = stage >= 1 ? leads : leads.slice(0, -1)
  const inCrm = stage >= 2 || stage === 0 ? leads : leads.slice(0, -1)
  const inDash = stage >= 3 || stage === 0 ? leads.length : Math.max(0, leads.length - 1)
  const week = leadWeekSeed.map((n, i) => n + (i === todayIndex ? inDash : 0))
  const peak = Math.max(...week, 8)
  const total = week.reduce((sum, n) => sum + n, 0)

  return (
    <section id="lead" className="run" data-demo="lead" data-stage={stage} aria-labelledby="lead-title">
      <header className="run__head">
        <DemoBadge />
        <h3 id="lead-title">{d.title}</h3>
        <p>{d.intro}</p>
        <p className="run__disclaimer">{d.disclaimer}</p>
      </header>

      <ol className="run__steps mono" aria-hidden="true">
        {d.steps.map((step, i) => (
          <li key={step} className={stage > i || (i === 0 && stage === 0) ? 'is-on' : ''}>
            <span>{step}</span>
            {i < d.steps.length - 1 && <ArrowRight />}
          </li>
        ))}
      </ol>

      <div className="run__grid">
        <form className="panel run__form" onSubmit={submit}>
          <p className="panel__title mono">{d.form.legend}</p>
          <label>
            <span className="mono">{d.form.name}</span>
            <input
              type="text"
              name="name"
              value={name}
              maxLength={40}
              required
              placeholder={d.form.namePlaceholder}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            <span className="mono">{d.form.need}</span>
            <select name="need" value={need} onChange={(e) => setNeed(Number(e.target.value))}>
              {d.form.needs.map((option, i) => (
                <option key={option} value={i}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mono">{d.form.budget}</span>
            <select name="budget" value={budget} onChange={(e) => setBudget(Number(e.target.value))}>
              {d.form.budgets.map((option, i) => (
                <option key={option} value={i}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn--solid" disabled={busy} data-log="off">
            <span>{stage === 4 ? d.form.again : d.form.submit}</span>
            <ArrowRight />
          </button>
        </form>

        <div className="panel run__bot">
          <p className="panel__title mono">{d.bot.title}</p>
          <ul className="run__chat" aria-live="polite">
            {inBot.length === 0 && <li className="run__empty mono">{d.bot.empty}</li>}
            {inBot.slice(-2).map((lead) => (
              <li key={lead.no} className="bubble" data-lead={lead.no}>
                <b className="mono">{d.bot.botName}</b>
                <span>
                  {d.bot.newLead} №{lead.no}
                </span>
                <span>
                  {d.bot.from}: {lead.name}
                </span>
                <span>
                  {d.bot.need}: {d.form.needs[lead.need]}
                </span>
                <span>
                  {d.bot.budget}: {d.form.budgets[lead.budget]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel run__crm">
          <p className="panel__title mono">{d.crm.title}</p>
          <table>
            <thead>
              <tr className="mono">
                {d.crm.cols.map((col) => (
                  <th key={col} scope="col">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...inCrm].reverse().slice(0, 3).map((lead) => {
                const fresh = lead === last && stage === 2
                return (
                  <tr key={lead.no} className="is-new" data-lead={lead.no}>
                    <td className="mono">{lead.no}</td>
                    <td>{lead.name}</td>
                    <td>{d.form.needs[lead.need]}</td>
                    <td>
                      <span className="status mono is-hot">{fresh ? d.crm.statusNew : d.crm.statusQueued}</span>
                    </td>
                  </tr>
                )
              })}
              {d.crm.seed.map((row, i) => (
                <tr key={row.name}>
                  <td className="mono">{leadFirstNumber - 1 - i}</td>
                  <td>{row.name}</td>
                  <td>{row.need}</td>
                  <td>
                    <span className="status mono">{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel run__dash">
          <p className="panel__title mono">{d.dash.title}</p>
          <div className="run__kpi">
            <p>
              <span className="mono">{d.dash.today}</span>
              <b data-kpi="today">{week[todayIndex]}</b>
            </p>
            <p>
              <span className="mono">{d.dash.total}</span>
              <b data-kpi="total">{total}</b>
            </p>
          </div>
          <ol className="bars" aria-hidden="true">
            {week.map((n, i) => (
              <li key={d.dash.days[i]} className={i === todayIndex ? 'is-today' : ''}>
                <i style={{ height: `${(n / peak) * 100}%` }} />
                <span className="mono">{d.dash.days[i]}</span>
              </li>
            ))}
          </ol>
          <p className="note">{d.dash.caption}</p>
        </div>
      </div>

      <p className="run__done mono" role="status">
        {stage === 4 ? d.done : ''}
      </p>
    </section>
  )
}
