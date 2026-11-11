import { chapterIds } from '../content'
import { useLang } from '../i18n/LangContext'
import { emit } from '../system/bus'
import { NODE_CHAPTER, NODE_IDS, NODES, type NodeId } from '../system/graph'
import { registerHotspot } from '../system/hotspots'
import { select, useChapter, useRoute } from '../system/view'

const CONTACT = 6

/**
 * Невидимые кнопки поверх узлов карты: узел можно нажать мышью, пальцем и с клавиатуры.
 * На главной клик выбирает проект, на странице проекта ведёт на страницу другого.
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
    <div className="hotspots">
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
          onPointerEnter={() => emit({ kick: [id] })}
          onFocus={() => emit({ kick: [id] })}
          onClick={() => open(id)}
        />
      ))}
    </div>
  )
}
