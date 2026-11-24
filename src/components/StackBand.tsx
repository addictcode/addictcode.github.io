import { useLang } from '../i18n/LangContext'

/** Полоса со стеком: бежит по кругу, для скринридера — обычный список. */
export function StackBand() {
  const { t } = useLang()
  const row = t.stack.map((item) => (
    <span key={item} className="band__item">
      {item}
    </span>
  ))
  return (
    <div className="band" role="region" aria-label="Stack">
      <ul className="visually-hidden">
        {t.stack.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="band__track" aria-hidden="true">
        <div className="band__run">{row}</div>
        <div className="band__run">{row}</div>
      </div>
    </div>
  )
}
