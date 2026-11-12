import { useState, type FormEvent } from 'react'
import { cabinetSeedPlans, planPrices } from '../content/demoData'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'

/** Кабинет с подпиской: регистрация → тариф → оплата → кабинет пользователя и админка. */
export function CabinetDemo() {
  const { t } = useLang()
  const d = t.lab.cabinet
  const [draft, setDraft] = useState('')
  const [user, setUser] = useState('')
  const [choice, setChoice] = useState(1)
  const [plan, setPlan] = useState<number | null>(null)
  const [role, setRole] = useState(0)

  const register = (event: FormEvent) => {
    event.preventDefault()
    if (draft.trim()) setUser(draft.trim())
  }
  const pay = () => {
    setPlan(choice)
    emit({ kick: ['billing'], route: ['billing', 'db'] })
  }
  const price = (index: number) => `${planPrices[index]} ${t.lab.currency}`

  if (!user) {
    return (
      <form className="panel run__form" onSubmit={register}>
        <p className="panel__title mono">{d.register}</p>
        <label>
          <span className="mono">{d.name}</span>
          <input type="text" name="name" value={draft} maxLength={40} required placeholder={d.namePlaceholder} autoComplete="off" onChange={(e) => setDraft(e.target.value)} />
        </label>
        <button type="submit" className="btn btn--solid" data-log="off">
          {d.create}
        </button>
      </form>
    )
  }

  if (plan === null) {
    return (
      <div className="panel">
        <p className="panel__title mono">
          {user} · {d.choose}
        </p>
        <ul className="plans">
          {d.plans.map((item, i) => (
            <li key={item.name}>
              <button type="button" aria-pressed={choice === i} data-log="off" data-plan={i} onClick={() => setChoice(i)}>
                <b>{item.name}</b>
                <span className="plans__price">{price(i)}</span>
                <span className="mono">{d.perMonth}</span>
                <span>{item.limit}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn--solid" data-log="off" data-action="pay" onClick={pay}>
          {t.lab.pay} · {price(choice)}
        </button>
      </div>
    )
  }

  const users = [...d.seed.map((name, i) => ({ name, plan: cabinetSeedPlans[i], mine: false })), { name: user, plan, mine: true }]

  return (
    <div className="lab__stack" data-cabinet="ready">
      <div className="panel">
        <div className="seg mono" role="group" aria-label={d.role}>
          {d.roles.map((name, i) => (
            <button key={name} type="button" aria-pressed={role === i} data-log="off" data-role={i} onClick={() => setRole(i)}>
              {name}
            </button>
          ))}
        </div>
        {role === 0 ? (
          <>
            <p className="panel__title mono">
              {d.userView} · {user}
            </p>
            <p className="kpi">
              <span className="mono">{d.current}</span>
              <b data-kpi="plan">{d.plans[plan].name}</b>
            </p>
            <p className="note">
              {d.plans[plan].limit} · {price(plan)} {d.perMonth} · <span className="status mono is-hot">{d.active}</span>
            </p>
            <div className="opts">
              <button type="button" className="btn" data-log="off" onClick={() => setPlan(null)}>
                {d.change}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="panel__title mono">{d.adminView}</p>
            <table className="table">
              <thead>
                <tr className="mono">
                  {d.cols.map((col) => (
                    <th key={col} scope="col">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.name} className={item.mine ? 'is-new' : ''}>
                    <td>{item.name}</td>
                    <td>{d.plans[item.plan].name}</td>
                    <td className="mono">{price(item.plan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="kpi">
              <span className="mono">{d.mrr}</span>
              <b data-kpi="mrr">
                {users.reduce((sum, item) => sum + planPrices[item.plan], 0)} {t.lab.currency}
              </b>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
