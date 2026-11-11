import { useEffect, useRef, useState } from 'react'
import {
  monitorBrands,
  monitorCurrency,
  monitorPrices,
  monitorRunLength,
  monitorSizes,
} from '../content/demoData'
import { useLang } from '../i18n/LangContext'
import { DemoBadge } from '../components/Links'
import { emit } from '../system/bus'

interface Listing {
  id: number
  item: number
  brand: string
  size: string
  price: number
  match: boolean
}

interface Filter {
  brand: string
  size: string
  priceMax: number
}

const TICK_MS = 420
const FEED_SIZE = 5
const ALERTS_SIZE = 3

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]

function makeListing(id: number, filter: Filter, itemCount: number): Listing {
  // каждое пятое объявление гарантированно подходит под фильтр, чтобы прогон не был пустым
  const forced = id % 5 === 3
  const brand = forced && filter.brand ? filter.brand : pick(monitorBrands)
  const size = forced && filter.size ? filter.size : pick(monitorSizes)
  const price = forced
    ? 5 + Math.floor(Math.random() * (filter.priceMax - 4))
    : 5 + Math.floor(Math.random() * 80)
  const match =
    (!filter.brand || brand === filter.brand) &&
    (!filter.size || size === filter.size) &&
    price <= filter.priceMax
  return { id, item: Math.floor(Math.random() * itemCount), brand, size, price, match }
}

/** Симулятор мониторинга: поток выдуманных объявлений, совпадения приходят уведомлениями. */
export function MonitorDemo() {
  const { t } = useLang()
  const m = t.bot.monitor
  const [filter, setFilter] = useState<Filter>({ brand: '', size: '', priceMax: monitorPrices[2] })
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const filterRef = useRef(filter)

  useEffect(() => {
    filterRef.current = filter
  }, [filter])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setListings((prev) => {
        const next = [...prev, makeListing(prev.length + 1, filterRef.current, m.items.length)]
        if (next.length >= monitorRunLength) {
          setRunning(false)
          setFinished(true)
        }
        return next
      })
    }, TICK_MS)
    return () => window.clearInterval(timer)
  }, [running, m.items.length])

  const start = () => {
    setListings([])
    setFinished(false)
    setRunning(true)
    emit({ kind: 'monitor', textKey: 'monitorStart', kick: ['bot'] })
  }

  const matches = listings.filter((l) => l.match)
  const describe = (l: Listing) => `${m.items[l.item]} ${l.brand}, ${l.size}`

  // совпадение и конец прогона уходят на карту и в журнал
  const newest = listings[listings.length - 1]
  const newestId = newest?.id
  const newestText = newest?.match ? `${describe(newest)} · ${newest.price} ${monitorCurrency}` : ''
  useEffect(() => {
    if (newestText) emit({ kind: 'match', text: newestText, kick: ['bot'] })
    if (newestId === monitorRunLength) emit({ kind: 'monitor', textKey: 'monitorDone' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- событие привязано к номеру объявления, а не к тексту
  }, [newestId])
  const feed = listings.slice(-FEED_SIZE).reverse()
  const alerts = matches.slice(-ALERTS_SIZE).reverse()

  return (
    <section className="monitor" aria-labelledby="monitor-title" data-demo="monitor">
      <header className="monitor__head">
        <DemoBadge />
        <h3 id="monitor-title">{m.title}</h3>
      </header>
      <p className="note">{m.note}</p>

      <div className="monitor__filter">
        <label>
          <span className="mono">{m.brand}</span>
          <select
            value={filter.brand}
            onChange={(e) => setFilter({ ...filter, brand: e.target.value })}
            data-field="brand"
          >
            <option value="">{m.anyBrand}</option>
            {monitorBrands.map((brand) => (
              <option key={brand}>{brand}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mono">{m.size}</span>
          <select
            value={filter.size}
            onChange={(e) => setFilter({ ...filter, size: e.target.value })}
            data-field="size"
          >
            <option value="">{m.anySize}</option>
            {monitorSizes.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mono">{m.priceTo}</span>
          <select
            value={filter.priceMax}
            onChange={(e) => setFilter({ ...filter, priceMax: Number(e.target.value) })}
            data-field="price"
          >
            {monitorPrices.map((price) => (
              <option key={price} value={price}>
                {price} {monitorCurrency}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn--solid monitor__run"
          onClick={running ? () => setRunning(false) : start}
          data-action="monitor-toggle"
          data-log="off"
        >
          <span>{running ? m.stop : finished ? m.restart : m.start}</span>
        </button>
      </div>

      <dl className="monitor__counters">
        <div>
          <dt className="mono">{m.checked}</dt>
          <dd data-counter="checked">{listings.length}</dd>
        </div>
        <div>
          <dt className="mono">{m.found}</dt>
          <dd data-counter="found">{matches.length}</dd>
        </div>
      </dl>
      <p className="mono monitor__state" role="status" data-state={finished ? 'done' : running ? 'run' : 'idle'}>
        {finished ? m.done : running ? '' : listings.length === 0 ? m.idle : ''}
      </p>

      <div className="monitor__cols">
        <div>
          <p className="mono monitor__label">{m.feed}</p>
          <ul className="monitor__feed mono">
            {feed.map((l) => (
              <li key={l.id} className={l.match ? 'is-match' : ''}>
                <span>{describe(l)}</span>
                <span>
                  {l.price} {monitorCurrency}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mono monitor__label">{m.alerts}</p>
          <ul className="monitor__alerts" aria-live="polite">
            {alerts.length === 0 && <li className="monitor__empty mono">{m.noAlerts}</li>}
            {alerts.map((l) => (
              <li key={l.id} className="bubble">
                <b className="mono">{m.botName}</b>
                <span>
                  {m.newListing}: {describe(l)} · {l.price} {monitorCurrency}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
