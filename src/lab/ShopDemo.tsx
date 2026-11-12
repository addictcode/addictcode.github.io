import { useState } from 'react'
import { shopFirstOrder, shopPrices } from '../content/demoData'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'

interface Order {
  no: number
  lines: string
  sum: number
}

/** Магазин в мини-приложении: каталог, корзина, оплата и уведомление продавцу. */
export function ShopDemo() {
  const { t } = useLang()
  const d = t.lab.shop
  const [cart, setCart] = useState<number[]>(shopPrices.map(() => 0))
  const [orders, setOrders] = useState<Order[]>([])
  const [paid, setPaid] = useState(false)

  const total = cart.reduce((sum, qty, i) => sum + qty * shopPrices[i], 0)
  const add = (index: number) => {
    setPaid(false)
    setCart((prev) => prev.map((qty, i) => (i === index ? qty + 1 : qty)))
  }
  const pay = () => {
    const lines = cart
      .map((qty, i) => (qty > 0 ? `${d.products[i]} × ${qty}` : ''))
      .filter(Boolean)
      .join(', ')
    setOrders((prev) => [...prev, { no: shopFirstOrder + prev.length, lines, sum: total }])
    setCart(shopPrices.map(() => 0))
    setPaid(true)
    emit({ kick: ['shop'], route: ['shop', 'bot'] })
  }

  return (
    <div className="lab__cols">
      <div className="panel">
        <p className="panel__title mono">Telegram · {d.title}</p>
        <ul className="goods">
          {d.products.map((name, i) => (
            <li key={name}>
              <span className="mock__pic" aria-hidden="true" />
              <b>{name}</b>
              <span className="mono">
                {shopPrices[i]} {t.lab.currency}
              </span>
              <button type="button" className="btn" data-log="off" data-add={i} onClick={() => add(i)}>
                {d.add}
                {cart[i] > 0 ? ` · ${cart[i]}` : ''}
              </button>
            </li>
          ))}
        </ul>
        <p className="kpi">
          <span className="mono">{total === 0 ? d.empty : d.total}</span>
          <b data-kpi="total">
            {total} {t.lab.currency}
          </b>
        </p>
        <button type="button" className="btn btn--solid" data-log="off" data-action="pay" disabled={total === 0} onClick={pay}>
          {t.lab.pay}
        </button>
        <p className="lab__state mono" role="status">
          {paid ? d.paid : ''}
        </p>
      </div>

      <div className="panel">
        <p className="panel__title mono">Telegram · {d.seller}</p>
        <ul className="chat" aria-live="polite">
          {orders.length === 0 && <li className="run__empty mono">{d.sellerEmpty}</li>}
          {orders.map((order) => (
            <li key={order.no} className="bubble" data-order={order.no}>
              <b className="mono">{d.sellerBot}</b>
              <span>
                {d.order} #{order.no}
              </span>
              <span>{order.lines}</span>
              <span>
                {d.sum}: {order.sum} {t.lab.currency}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
