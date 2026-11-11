import { lazy, Suspense } from 'react'

const CubeCanvas = lazy(() => import('../scene/CubeCanvas'))

/** Служебный режим `?poster=N`: только фигура главы N, без текста. Из него снимаются постеры. */
export function PosterStage({ chapter }: { chapter: number }) {
  return (
    <div className="stage stage--poster">
      <Suspense fallback={null}>
        <CubeCanvas
          posterChapter={chapter}
          onReady={() => document.documentElement.setAttribute('data-poster-ready', '')}
        />
      </Suspense>
    </div>
  )
}
