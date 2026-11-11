import { lazy, Suspense, useEffect, useState } from 'react'
import { hasWebGL, pickStageMode } from './capability'
import { StaticStage } from './StaticStage'
import { useScrollChapter } from './useScrollChapter'

const CubeCanvas = lazy(() => import('../scene/CubeCanvas'))

const WAKE_EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'keydown', 'scroll'] as const

/**
 * Первое действие посетителя. До него статичный кадр неотличим от живой сцены,
 * поэтому тяжёлый чанк с three.js не мешает первой отрисовке и чтению.
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
 * Фиксированный слой под текстом. Сначала всегда статичный кадр; живая сцена
 * и моушен подгружаются отдельными чанками при первом действии посетителя.
 */
export function Stage() {
  const [mode, setMode] = useState(pickStageMode)
  const [load, setLoad] = useState(false)
  const [motionOn, setMotionOn] = useState(false)
  const [ready, setReady] = useState(false)
  useScrollChapter(!motionOn)

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
    }
  }, [load])

  return (
    <div className="stage" data-mode={mode} data-ready={ready || undefined}>
      <StaticStage hidden={ready} />
      {load && (
        <Suspense fallback={null}>
          <CubeCanvas onReady={() => setReady(true)} />
        </Suspense>
      )}
    </div>
  )
}
