import { lazy, Suspense } from 'react'
import { useLang } from '../i18n/LangContext'

const ConveyorCanvas = lazy(() => import('../scene/ConveyorCanvas'))

/** Служебный режим `?poster=N`: только сцена на станции N, без текста. Из него снимаются постеры. */
export function PosterStage({ station }: { station: number }) {
  const { t } = useLang()
  return (
    <div className="stage stage--poster">
      <Suspense fallback={null}>
        <ConveyorCanvas
          stamps={t.stations.map((s) => s.stamp)}
          posterStation={station}
          onReady={() => document.documentElement.setAttribute('data-poster-ready', '')}
        />
      </Suspense>
    </div>
  )
}
