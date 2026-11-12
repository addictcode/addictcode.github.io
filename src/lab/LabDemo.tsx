import { chapterIds } from '../content'
import { useLang } from '../i18n/LangContext'
import { FIRST_LAB_CHAPTER, LAB_KEYS } from '../system/graph'
import { AssistantDemo } from './AssistantDemo'
import { BookingDemo } from './BookingDemo'
import { CabinetDemo } from './CabinetDemo'
import { CrmSyncDemo } from './CrmSyncDemo'
import { PricesDemo } from './PricesDemo'
import { ShopDemo } from './ShopDemo'

const DEMOS = [BookingDemo, ShopDemo, AssistantDemo, CrmSyncDemo, PricesDemo, CabinetDemo]

/** Страница прототипа: оговорка, сам прототип и переход к остальным. */
export function LabDemo({ chapter }: { chapter: number }) {
  const { t } = useLang()
  const index = chapter - FIRST_LAB_CHAPTER
  const Demo = DEMOS[index]
  return (
    <>
      <p className="lead">{t.lab.items[LAB_KEYS[index]].text}</p>
      <p className="note">{t.lab.disclaimer}</p>
      <div className="lab" data-lab={chapterIds[chapter]}>
        <Demo />
      </div>
      <nav className="lab-nav" aria-label={t.lab.tabs}>
        <p className="mono label">{t.lab.tabs}</p>
        <ul>
          {LAB_KEYS.map((key, i) =>
            i === index ? null : (
              <li key={key}>
                <a href={`#/${chapterIds[FIRST_LAB_CHAPTER + i]}`} data-log="off">
                  {t.lab.items[key].name}
                </a>
              </li>
            ),
          )}
        </ul>
      </nav>
    </>
  )
}
