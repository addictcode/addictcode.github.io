import { chapterIds } from '../content'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'
import { FIRST_LAB_CHAPTER, NODE_CHAPTER, NODE_IDS, NODE_OFFERS, NODES, type NodeId } from '../system/graph'
import { profile } from '../content/profile'
import { registerHotspot, setHovered } from '../system/hotspots'
import { select, useChapter, useRoute } from '../system/view'

const CONTACT = 6

/**
 * Кнопки поверх узлов карты: узел можно нажать мышью, пальцем и с клавиатуры.
 * На главной у каждого узла висит подпись с услугами, клик выбирает проект;
 * на странице проекта подписей нет, клик ведёт на страницу другого проекта.
 */
export function Hotspots() {
  const { t } = useLang()
  const route = useRoute()
  const current = useChapter()

  const open = (id: NodeId) => {
    const chapter = NODE_CHAPTER[id]
    if (route === null) select(chapter === current ? null : chapter)
    else location.hash = chapter === CONTACT ? '#/' : `#/${chapterIds[chapter]}`
  }

  return (
    <div className="hotspots" data-tags={route === null || undefined} data-selected={(route === null && current !== null) || undefined}>
      {NODE_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className="hotspot"
          ref={(element) => registerHotspot(id, element)}
          aria-label={`${t.ui.openProject}: ${t.chapters[NODE_CHAPTER[id]]} (${NODES[id].label})`}
          aria-pressed={NODE_CHAPTER[id] === current}
          data-node={id}
          data-log="off"
          onPointerEnter={() => {
            setHovered(id)
            emit({ kick: [id] })
          }}
          onPointerLeave={() => setHovered(null)}
          onFocus={() => {
            setHovered(id)
            emit({ kick: [id] })
          }}
          onBlur={() => setHovered(null)}
          onClick={() => open(id)}
        >
          <span className="hotspot__tag" aria-hidden="true">
            {id === 'client' ? <b>@{profile.telegram}</b> : NODE_OFFERS[id].map((offer) => (
              <b key={offer}>
                {t.offer.items[offer].name}
                {NODE_CHAPTER[id] >= FIRST_LAB_CHAPTER && <i className="mono">{t.lab.demoTag}</i>}
              </b>
            ))}
          </span>
        </button>
      ))}
    </div>
  )
}
