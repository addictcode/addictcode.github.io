import { useState } from 'react'
import { pricesMine } from '../content/demoData'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'

const SELLERS = 3
const HISTORY = 12
/** стартовые цены продавцов: моя цена плюс небольшая наценка, без случайности */
const START = pricesMine.map((mine, row) => Array.from({ length: SELLERS }, (_, col) => mine + 1 + ((row + col * 2) % 4)))

function Spark({ values }: { values: number[] }) {
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const points = values.map((value, i) => `${(i / Math.max(1, HISTORY - 1)) * 100},${22 - ((value - min) / span) * 20}`).join(' ')
  return (
    <svg className="spark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Мониторинг цен: таблица конкурентов, история минимума, алерты и выгрузка. */
export function PricesDemo() {
  const { t } = useLang()
  const d = t.lab.prices
  const [prices, setPrices] = useState(START)
  const [history, setHistory] = useState(START.map((row) => [Math.min(...row)]))
  const [checks, setChecks] = useState(0)

  const check = () => {
    // цена каждого продавца сдвигается не больше чем на 8 % и не падает ниже половины моей
    const next = prices.map((row, r) => row.map((price) => Math.max(Math.round(pricesMine[r] / 2), Math.round(price * (0.92 + Math.random() * 0.14)))))
    setPrices(next)
    setHistory((prev) => prev.map((row, r) => [...row, Math.min(...next[r])].slice(-HISTORY)))
    setChecks((count) => count + 1)
    emit({ kick: ['prices'], route: ['parser', 'prices'] })
  }

  const cheaper = prices.map((row, r) => ({ r, min: Math.min(...row) })).filter(({ r, min }) => min < pricesMine[r])

  const download = () => {
    const rows = [d.cols.slice(0, 2 + SELLERS), ...prices.map((row, r) => [d.products[r], pricesMine[r], ...row])]
    const blob = new Blob([`\uFEFF${rows.map((row) => row.join(';')).join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'prices-demo.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="lab__stack">
      <div className="panel">
        <div className="opts">
          <button type="button" className="btn btn--solid" data-log="off" data-action="check" onClick={check}>
            {d.check}
          </button>
          <button type="button" className="btn" data-log="off" data-action="export" onClick={download}>
            {d.export}
          </button>
        </div>
        <div className="table-wrap">
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
              {prices.map((row, r) => (
                <tr key={d.products[r]}>
                  <td>{d.products[r]}</td>
                  <td className="mono">
                    {pricesMine[r]} {t.lab.currency}
                  </td>
                  {row.map((price, c) => (
                    <td key={c} className={`mono${price < pricesMine[r] ? ' is-low' : ''}`}>
                      {price} {t.lab.currency}
                    </td>
                  ))}
                  <td>
                    <Spark values={history[r]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="kpi">
          <span className="mono">{d.checks}</span>
          <b data-kpi="checks">{checks}</b>
        </p>
      </div>

      <div className="panel">
        <p className="panel__title mono">Telegram · {d.alerts}</p>
        <ul className="chat" aria-live="polite">
          {cheaper.length === 0 && <li className="run__empty mono">{d.noAlerts}</li>}
          {cheaper.map(({ r, min }) => (
            <li key={r} className="bubble" data-alert={r}>
              <b className="mono">{d.alertBot}</b>
              <span>
                {d.products[r]}: {min} {t.lab.currency}, {d.cheaper} ({pricesMine[r]} {t.lab.currency})
              </span>
            </li>
          ))}
        </ul>
        <p className="note">{d.note}</p>
      </div>
    </div>
  )
}
