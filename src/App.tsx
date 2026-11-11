import { Header, StationRail } from './components/Header'
import { Hero } from './components/Hero'
import {
  BotStation,
  CrmStation,
  DispatchStation,
  ParsingStation,
  RealtimeStation,
  SiteStation,
  SortingStation,
} from './components/Stations'
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
        <PosterStage station={Number(posterParam)} />
      </LangProvider>
    )
  }
  return (
    <LangProvider>
      <SkipLink />
      <Stage />
      <Header />
      <StationRail />
      <main id="main">
        <Hero />
        <SiteStation />
        <BotStation />
        <CrmStation />
        <RealtimeStation />
        <ParsingStation />
        <SortingStation />
        <DispatchStation />
      </main>
    </LangProvider>
  )
}
