import { lazy, Suspense, useEffect, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { hasWebGL, pickStageMode } from './capability'
import { useActiveChapter } from './store'
import { applyTheme } from './theme'
import { useScrollChapter } from './useScrollChapter'

const RibbonCanvas = lazy(() => import('../scene/RibbonCanvas'))

const WAKE_EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'keydown', 'scroll'] as const

/**
 * Первое действие посетителя. До него страница — статичные экраны с кадрами сцены,
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

/**
 * Слой сцены. Статичная версия — обычные экраны друг под другом с кадрами лент.
 * Живая версия закрепляет экраны, красит фон по скроллу и рисует ленты в canvas.
 */
export function Stage() {
  const { t } = useLang()
  const [mode, setMode] = useState(pickStageMode)
  const [load, setLoad] = useState(false)
  const [motionOn, setMotionOn] = useState(false)
  const active = useActiveChapter()
  useScrollChapter(!motionOn)

  // без моушена цвет шапки и навигации идёт за активной главой
  useEffect(() => {
    if (!motionOn) applyTheme(active)
  }, [active, motionOn])

  useEffect(() => {
    if (mode !== 'live') return
    return whenNeeded(() => {
      if (hasWebGL()) setLoad(true)
      else setMode('static')
    })
  }, [mode])

  useEffect(() => {
    if (!load) return
    let dispose: (() => void) | undefined
    let cancelled = false
    import('../motion/initMotion').then(({ initMotion }) => {
      if (cancelled) return
      dispose = initMotion()
      setMotionOn(true)
    })
    return () => {
      cancelled = true
      dispose?.()
      setMotionOn(false)
      document.documentElement.removeAttribute('data-canvas')
    }
  }, [load])

  return (
    <div className="stage" data-mode={mode}>
      {load && (
        <Suspense fallback={null}>
          <RibbonCanvas texts={t.ribbon} onReady={() => document.documentElement.setAttribute('data-canvas', '')} />
        </Suspense>
      )}
    </div>
  )
}
