import { useState, type FormEvent } from 'react'
import { crmFirstLead } from '../content/demoData'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'

interface Lead {
  no: number
  name: string
  source: number
  stage: number
}

interface LogLine {
  id: number
  no: number
  /** true — заявка создана, false — статус вернулся */
  created: boolean
  stage: number
}

const LOG_SIZE = 4

/** Заявка с сайта или из бота попадает в CRM, а смена статуса в CRM возвращается клиенту. */
export function CrmSyncDemo() {
  const { t } = useLang()
  const d = t.lab.crm
  const [leads, setLeads] = useState<Lead[]>([])
  const [log, setLog] = useState<LogLine[]>([])
  const [name, setName] = useState('')
  const [source, setSource] = useState(0)

  const write = (no: number, created: boolean, stage: number) => setLog((prev) => [...prev, { id: prev.length, no, created, stage }])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    const no = crmFirstLead + leads.length
    setLeads((prev) => [...prev, { no, name: name.trim(), source, stage: 0 }])
    write(no, true, 0)
    setName('')
    emit({ kick: ['sync'], route: source === 0 ? ['site', 'sync'] : ['bot', 'site', 'sync'] })
  }
  const move = (lead: Lead) => {
    setLeads((prev) => prev.map((item) => (item.no === lead.no ? { ...item, stage: item.stage + 1 } : item)))
    write(lead.no, false, lead.stage + 1)
    emit({ kick: ['sync'], route: ['sync', 'site'] })
  }

  return (
    <div className="lab__stack">
      <div className="lab__cols">
        <form className="panel run__form" onSubmit={submit}>
          <p className="panel__title mono">{d.form}</p>
          <label>
            <span className="mono">{d.name}</span>
            <input type="text" name="name" value={name} maxLength={40} required placeholder={d.namePlaceholder} autoComplete="off" onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span className="mono">{d.source}</span>
            <select name="source" value={source} onChange={(e) => setSource(Number(e.target.value))}>
              {d.sources.map((option, i) => (
                <option key={option} value={i}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn--solid" data-log="off">
            {d.submit}
          </button>
        </form>

        <div className="panel">
          <p className="panel__title mono">{d.back}</p>
          <ul className="plain" aria-live="polite">
            {leads.length === 0 && <li className="run__empty mono">{d.backEmpty}</li>}
            {leads.map((lead) => (
              <li key={lead.no} data-client-lead={lead.no}>
                <span className="mono">#{lead.no}</span> {d.status}: <span className="status mono is-hot">{d.stages[lead.stage]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel">
        <p className="panel__title mono">{d.pipeline}</p>
        <div className="pipeline">
          {d.stages.map((stage, index) => (
            <div key={stage} data-stage={index}>
              <p className="mono label">{stage}</p>
              {leads.filter((lead) => lead.stage === index).length === 0 && <p className="run__empty mono">{d.emptyStage}</p>}
              {leads
                .filter((lead) => lead.stage === index)
                .map((lead) => (
                  <div key={lead.no} className="leadcard" data-lead={lead.no}>
                    <span className="mono">
                      #{lead.no} · {d.sources[lead.source]}
                    </span>
                    <b>{lead.name}</b>
                    {index < d.stages.length - 1 && (
                      <button type="button" className="btn" data-log="off" data-action="move" onClick={() => move(lead)}>
                        {d.move}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <p className="panel__title mono">{d.log}</p>
        <ul className="synclog mono">
          {log.slice(-LOG_SIZE).map((line) => (
            <li key={line.id}>
              #{line.no} · {line.created ? d.logCreated : `${d.logStatus}: ${d.stages[line.stage]}`}
            </li>
          ))}
        </ul>
        <p className="note">{d.note}</p>
      </div>
    </div>
  )
}
