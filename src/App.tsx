import { ChapterRail, Header } from './components/Header'
import { Hero } from './components/Hero'
import {
  BotChapter,
  ContactChapter,
  CrmChapter,
  ParsingChapter,
  RealtimeChapter,
  SiteChapter,
  StackChapter,
} from './components/Chapters'
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
      <SkipLink />
      <Stage />
      <Header />
      <ChapterRail />
      <main id="main">
        <Hero />
        <SiteChapter />
        <BotChapter />
        <CrmChapter />
        <RealtimeChapter />
        <ParsingChapter />
        <StackChapter />
        <ContactChapter />
      </main>
    </LangProvider>
  )
}
