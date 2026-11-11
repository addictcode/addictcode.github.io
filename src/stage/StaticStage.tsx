import { useEffect, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { getFraming, POSTER_UNITS } from './framing'
import { useActiveChapter } from './store'

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

/** Статичный кадр фигуры для активной главы: тот же ракурс, что у живой 3D-сцены. */
export function StaticStage({ hidden = false }: { hidden?: boolean }) {
  const { t } = useLang()
  const active = useActiveChapter()
  const { w, h } = useViewport()
  const { zoom, anchorX, anchorY } = getFraming(w, h, active)
  const size = POSTER_UNITS * zoom
  return (
    <picture className="stage__poster" data-hidden={hidden || undefined}>
      <source srcSet={`/posters/chapter-${active}.avif`} type="image/avif" />
      <img
        src={`/posters/chapter-${active}.webp`}
        alt={`${t.ui.stageAlt}: ${t.chapters[active]}`}
        width={size}
        height={size}
        decoding="async"
        fetchPriority={active === 0 ? 'high' : 'auto'}
        style={{ left: anchorX - size / 2, top: anchorY - size / 2, width: size, height: size }}
      />
    </picture>
  )
}
