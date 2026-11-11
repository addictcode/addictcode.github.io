import { lazy, Suspense, useEffect, useState } from 'react'
import { useLang } from '../i18n/LangContext'
import { pickStageMode } from './capability'
import { StaticStage } from './StaticStage'
import { useScrollStation } from './useScrollStation'

const ConveyorCanvas = lazy(() => import('../scene/ConveyorCanvas'))

/** Когда браузер освободится после загрузки страницы. */
function whenIdle(run: () => void): () => void {
  let idle = 0
  let timer = 0
  const schedule = () => {
    if ('requestIdleCallback' in window) idle = requestIdleCallback(run, { timeout: 2500 })
    else timer = setTimeout(run, 600)
  }
  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })
  return () => {
    window.removeEventListener('load', schedule)
    if (idle) cancelIdleCallback(idle)
    clearTimeout(timer)
  }
}

/**
 * Фиксированный слой под текстом. Сначала всегда статичный кадр; живая сцена
 * и моушен подгружаются отдельным чанком, когда страница уже читается.
 */
export function Stage() {
  const { t } = useLang()
  const [mode] = useState(pickStageMode)
  const [load, setLoad] = useState(false)
  const [motionOn, setMotionOn] = useState(false)
  const [ready, setReady] = useState(false)
  useScrollStation(!motionOn)

  useEffect(() => {
    if (mode !== 'live') return
    return whenIdle(() => setLoad(true))
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

  const stamps = t.stations.map((station) => station.stamp)

  return (
    <div className="stage" data-mode={mode} data-ready={ready || undefined}>
      <StaticStage hidden={ready} />
      {load && (
        <Suspense fallback={null}>
          <ConveyorCanvas stamps={stamps} onReady={() => setReady(true)} />
        </Suspense>
      )}
    </div>
  )
}
