import { useLang } from '../i18n/LangContext'

/** [строка, первый день, длительность, конфликт] */
const BOOKINGS: [number, number, number, boolean][] = [
  [0, 0, 2, false],
  [0, 3, 2, false],
  [1, 1, 3, false],
  [2, 0, 1, false],
  [2, 2, 2, false],
  [3, 1, 2, false],
  [3, 2, 2, true],
]

/** Схема экрана диспетчера: сетка «бригады × дни» с отклонённой двойной бронью. */
export function CrmMock() {
  const { t } = useLang()
  const { mock } = t.crm
  return (
    <figure className="mock">
      <div className="mock__frame">
        <p className="plan__title mono">{mock.title}</p>
        <div className="plan" aria-hidden="true">
          <span />
          {mock.days.map((day) => (
            <span key={day} className="plan__day mono">
              {day}
            </span>
          ))}
          {mock.crews.map((crew, row) => (
            <div key={crew} className="plan__row">
              <span className="plan__crew mono">{crew}</span>
              <div className="plan__track">
                {BOOKINGS.filter((b) => b[0] === row).map(([, start, span, conflict]) => (
                  <i
                    key={`${start}-${span}-${conflict}`}
                    className={conflict ? 'is-conflict' : ''}
                    style={{ gridColumn: `${start + 1} / span ${span}` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="plan__legend mono">
          <span>
            <i /> {mock.legend[0]}
          </span>
          <span>
            <i className="is-conflict" /> {mock.legend[1]}
          </span>
        </p>
      </div>
      <figcaption>{mock.caption}</figcaption>
    </figure>
  )
}
