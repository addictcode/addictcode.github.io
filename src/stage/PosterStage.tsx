import { lazy, Suspense } from 'react'
import { useLang } from '../i18n/LangContext'

const RibbonCanvas = lazy(() => import('../scene/RibbonCanvas'))

/** Служебный режим `?poster=N`: только ленты главы N на прозрачном фоне. Из него снимаются постеры. */
export function PosterStage({ chapter }: { chapter: number }) {
  const { t } = useLang()
  return (
    <div className="stage stage--poster">
      <Suspense fallback={null}>
        <RibbonCanvas
          texts={t.ribbon}
          posterChapter={chapter}
          onReady={() => document.documentElement.setAttribute('data-poster-ready', '')}
        />
      </Suspense>
    </div>
  )
}
