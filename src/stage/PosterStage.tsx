import { lazy, Suspense } from 'react'
import { SHAPES, type ShapeId } from '../system/graph'

const SystemCanvas = lazy(() => import('../scene/SystemCanvas'))

/** Служебный режим `?poster=core`: только фигура в этой форме. Из него снимается кадр статичной версии. */
export function PosterStage({ shape }: { shape: string }) {
  const id: ShapeId = (SHAPES as readonly string[]).includes(shape) ? (shape as ShapeId) : 'core'
  return (
    <div className="stage stage--poster">
      <Suspense fallback={null}>
        <SystemCanvas posterShape={id} onReady={() => document.documentElement.setAttribute('data-poster-ready', '')} />
      </Suspense>
    </div>
  )
}
