import { Frames } from './components/Frames'
import { ChapterRail, Header } from './components/Header'
import { SheetProvider } from './components/Sheets'
import { LangProvider, useLang } from './i18n/LangContext'
import { PosterStage } from './stage/PosterStage'
import { Stage } from './stage/Stage'

function SkipLink() {
  const { t } = useLang()
  return (
    <a className="skip" href="#main">
      {t.ui.skip}
    </a>
  )
}

const posterParam = new URLSearchParams(location.search).get('poster')

export default function App() {
  if (posterParam !== null) {
    return (
      <LangProvider>
        <PosterStage chapter={Number(posterParam)} />
      </LangProvider>
    )
  }
  return (
    <LangProvider>
      <SheetProvider>
        <SkipLink />
        <Stage />
        <Header />
        <ChapterRail />
        <main id="main">
          <Frames />
        </main>
      </SheetProvider>
    </LangProvider>
  )
}
