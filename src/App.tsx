import { Chapters } from './components/Chapters'
import { Header } from './components/Header'
import { Hud } from './components/Hud'
import { LangProvider, useLang } from './i18n/LangContext'
import { PosterStage } from './stage/PosterStage'
import { Stage } from './stage/Stage'
import { useScrollProgress } from './system/progress'
import { useSiteEvents } from './system/useSiteEvents'

function SkipLink() {
  const { t } = useLang()
  return (
    <a className="skip" href="#main" data-log="off">
      {t.ui.skip}
    </a>
  )
}

function Site() {
  useScrollProgress()
  useSiteEvents()
  return (
    <>
      <SkipLink />
      <Stage />
      <Header />
      <main id="main">
        <Chapters />
      </main>
      <Hud />
    </>
  )
}

const posterParam = new URLSearchParams(location.search).get('poster')

export default function App() {
  if (posterParam !== null) return <PosterStage chapter={Number(posterParam)} />
  return (
    <LangProvider>
      <Site />
    </LangProvider>
  )
}
