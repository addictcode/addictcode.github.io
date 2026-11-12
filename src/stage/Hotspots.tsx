import { chapterIds } from '../content'
import { profile } from '../content/profile'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'
import { CHAPTER_NODE, CONTACT_CHAPTER, FIRST_LAB_CHAPTER, NODE_CHAPTER, NODE_IDS, NODE_OFFERS, NODES, type NodeId } from '../system/graph'
import { registerHotspot } from '../system/hotspots'
import { useChapter } from '../system/view'

/**
 * Кнопки поверх узлов карты: узел можно нажать мышью, пальцем и с клавиатуры.
 * При наведении и у проекта, о котором сейчас читают, рядом с узлом видна подсказка:
 * что это за проект, какие услуги в нём работают и что будет по нажатию.
 */
export function Hotspots() {
  const { t } = useLang()
  const current = useChapter()

  const open = (id: NodeId) => {
    const chapter = NODE_CHAPTER[id]
    location.hash = chapter === CONTACT_CHAPTER ? '#contact' : `#/${chapterIds[chapter]}`
  }

  return (
    <div className="hotspots">
      {NODE_IDS.map((id) => {
        const chapter = NODE_CHAPTER[id]
        const demo = chapter >= FIRST_LAB_CHAPTER
        return (
          <button
            key={id}
            type="button"
            className="hotspot"
            ref={(element) => registerHotspot(id, element)}
            aria-label={`${t.ui.openProject}: ${t.chapters[chapter]} (${NODES[id].label})`}
            // у проекта из двух узлов подсказка одна — у главного
            data-active={(chapter === current && CHAPTER_NODE[chapter] === id) || undefined}
            data-node={id}
            data-log="off"
            onPointerEnter={() => emit({ kick: [id] })}
            onFocus={() => emit({ kick: [id] })}
            onClick={() => open(id)}
          >
            <span className="tip" aria-hidden="true">
              <span className="tip__head mono">
                <b>{NODES[id].label}</b>
                {demo && <i className="tag mono">{t.lab.demoTag}</i>}
              </span>
              <span className="tip__title">{id === 'client' ? `@${profile.telegram}` : t.chapters[chapter]}</span>
              {NODE_OFFERS[id].map((offer) => (
                <span key={offer} className="tip__line">
                  {t.offer.items[offer].name}
                </span>
              ))}
              <span className="tip__go mono">{chapter === CONTACT_CHAPTER ? t.home.nav.contact : t.ui.more} →</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
