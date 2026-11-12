import { useState } from 'react'
import { bookingPrices, bookingSeed, bookingSlots } from '../content/demoData'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'

interface Booking {
  client: string
  service: number
  day: number
  slot: number
  mine: boolean
}

/** Запись через бота: услуга → день → время → оплата. Справа то, что видит владелец. */
export function BookingDemo() {
  const { t } = useLang()
  const d = t.lab.booking
  const [service, setService] = useState<number | null>(null)
  const [day, setDay] = useState<number | null>(null)
  const [slot, setSlot] = useState<number | null>(null)
  const [mine, setMine] = useState<Booking | null>(null)
  const [cancelled, setCancelled] = useState(false)

  const seeded: Booking[] = bookingSeed.map(([s, sl], i) => ({ client: d.seed[i], service: s, day: 0, slot: sl, mine: false }))
  const bookings = mine ? [...seeded, mine] : seeded
  const taken = (dayIndex: number, slotIndex: number) => bookings.some((b) => b.day === dayIndex && b.slot === slotIndex)
  const price = (index: number) => `${bookingPrices[index]} ${t.lab.currency}`

  const pay = () => {
    if (service === null || day === null || slot === null) return
    setMine({ client: t.lab.you, service, day, slot, mine: true })
    emit({ kick: ['booking'], route: ['booking', 'bot'] })
  }
  const reset = (wasCancelled: boolean) => {
    setService(null)
    setDay(null)
    setSlot(null)
    setMine(null)
    setCancelled(wasCancelled)
  }

  return (
    <div className="lab__stack">
      <div className="panel">
        <p className="panel__title mono">Telegram · {d.botName}</p>
        <ul className="chat" aria-live="polite">
          {cancelled && <li className="bubble">{d.cancelled}</li>}
          <li className="bubble">{d.greet}</li>
          {service !== null && <li className="bubble bubble--me">{d.services[service]}</li>}
          {service !== null && <li className="bubble">{d.pickDay}</li>}
          {day !== null && <li className="bubble bubble--me">{d.days[day]}</li>}
          {day !== null && <li className="bubble">{d.pickSlot}</li>}
          {slot !== null && <li className="bubble bubble--me">{bookingSlots[slot]}</li>}
          {slot !== null && service !== null && (
            <li className="bubble">
              {d.invoice}: {price(service)}
            </li>
          )}
          {mine && (
            <li className="bubble" data-done>
              {d.confirmed} {d.reminder}
            </li>
          )}
        </ul>
        <div className="opts">
          {service === null &&
            d.services.map((name, i) => (
              <button key={name} type="button" className="btn" data-log="off" onClick={() => setService(i)}>
                {name} · {price(i)}
              </button>
            ))}
          {service !== null &&
            day === null &&
            d.days.map((name, i) => (
              <button key={name} type="button" className="btn" data-log="off" onClick={() => setDay(i)}>
                {name}
              </button>
            ))}
          {day !== null &&
            slot === null &&
            bookingSlots.map((time, i) => (
              <button key={time} type="button" className="btn" data-log="off" disabled={taken(day, i)} onClick={() => setSlot(i)}>
                {time}
                {taken(day, i) ? ` · ${d.taken}` : ''}
              </button>
            ))}
          {slot !== null && !mine && (
            <button type="button" className="btn btn--solid" data-log="off" data-action="pay" onClick={pay}>
              {t.lab.pay}
            </button>
          )}
          {mine && (
            <button type="button" className="btn" data-log="off" onClick={() => reset(true)}>
              {d.cancel}
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <p className="panel__title mono">{d.admin}</p>
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
            {bookings.map((b) => (
              <tr key={`${b.day}-${b.slot}`} className={b.mine ? 'is-new' : ''}>
                <td>{b.client}</td>
                <td>{d.services[b.service]}</td>
                <td className="mono">
                  {d.days[b.day]}, {bookingSlots[b.slot]}
                </td>
                <td>
                  <span className={`status mono${b.mine ? ' is-hot' : ''}`}>{d.paid}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="kpi">
          <span className="mono">{d.revenue}</span>
          <b data-kpi="revenue">
            {bookings.reduce((sum, b) => sum + bookingPrices[b.service], 0)} {t.lab.currency}
          </b>
        </p>
      </div>
    </div>
  )
}
