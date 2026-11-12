import { lazy, Suspense } from 'react'

const SystemCanvas = lazy(() => import('../scene/SystemCanvas'))

/** Служебный режим `?poster=N`: только карта на главе N. Из него снимаются статичные кадры. */
export function PosterStage({ chapter }: { chapter: number }) {
  return (
    <div className="stage stage--poster">
      <Suspense fallback={null}>
        <SystemCanvas posterChapter={chapter} onReady={() => document.documentElement.setAttribute('data-poster-ready', '')} />
      </Suspense>
    </div>
  )
}
