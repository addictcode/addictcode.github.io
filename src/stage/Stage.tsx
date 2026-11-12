import { lazy, Suspense, useEffect, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { hasWebGL, pickStageMode } from '../system/capability'
import { useRoute } from '../system/view'

const SystemCanvas = lazy(() => import('../scene/SystemCanvas'))

const WAKE_EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'keydown', 'scroll'] as const

/**
 * Первое действие посетителя. До него на месте карты стоит её кадр,
 * поэтому тяжёлый чанк с three.js не мешает первой отрисовке.
 * `?eager` грузит сцену сразу после загрузки страницы (для отладки и замеров).
 */
function whenNeeded(run: () => void): () => void {
  const eager = new URLSearchParams(location.search).has('eager')
  let timer = 0
  const wake = () => {
    stop()
    run()
  }
  const stop = () => {
    clearTimeout(timer)
    WAKE_EVENTS.forEach((type) => window.removeEventListener(type, wake))
    window.removeEventListener('load', onLoad)
  }
  const onLoad = () => {
    timer = window.setTimeout(wake, 300)
  }
  WAKE_EVENTS.forEach((type) => window.addEventListener(type, wake, { passive: true }))
  if (eager) {
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad)
  }
  return stop
}

/** Кадр фигуры: широкий и вертикальный. Он же — статичная версия без WebGL. */
function Poster() {
  const { t } = useLang()
  return (
    <picture className="stage__poster">
      <source media="(max-width: 899px)" srcSet="/posters/core-m.avif" type="image/avif" />
      <source media="(max-width: 899px)" srcSet="/posters/core-m.webp" type="image/webp" />
      <source srcSet="/posters/core.avif" type="image/avif" />
      <img src="/posters/core.webp" alt={t.ui.stageAlt} width={1600} height={1000} decoding="async" fetchPriority="high" />
    </picture>
  )
}

/**
 * Слой фигуры под текстом. Живая версия рисует её в canvas,
 * статичная показывает кадр на первом экране главной.
 */
export function Stage() {
  const [mode, setMode] = useState(pickStageMode)
  const [load, setLoad] = useState(false)
  const [ready, setReady] = useState(false)
  const home = useRoute() === null

  useEffect(() => {
    if (mode !== 'live') return
    return whenNeeded(() => {
      if (hasWebGL()) setLoad(true)
      else setMode('static')
    })
  }, [mode])

  useEffect(() => {
    document.documentElement.toggleAttribute('data-canvas', ready)
  }, [ready])

  return (
    <div className="stage" data-mode={mode} data-ready={ready || undefined}>
      {!ready && home && <Poster />}
      {load && (
        <Suspense fallback={null}>
          <SystemCanvas onReady={() => setReady(true)} />
        </Suspense>
      )}
    </div>
  )
}
