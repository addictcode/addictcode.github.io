import { Header } from './components/Header'
import { Home } from './components/Home'
import { ProjectPage } from './components/ProjectPage'
import { useEffect } from 'react'
import { LangProvider, useLang } from './i18n/LangContext'
import { PosterStage } from './stage/PosterStage'
import { Stage } from './stage/Stage'
import { useSiteEvents } from './system/useSiteEvents'
import { useRoute } from './system/view'

function SkipLink() {
  const { t } = useLang()
  return (
    <a className="skip" href="#main" data-log="off" onClick={(event) => {
      // адрес страницы занят маршрутом, поэтому фокус переносится вручную
      event.preventDefault()
      document.getElementById('main')?.focus()
    }}>
      {t.ui.skip}
    </a>
  )
}

function Site() {
  const route = useRoute()
  useSiteEvents()
  // вёрстка и затемнение под текстом зависят от того, главная это или страница проекта
  useEffect(() => {
    document.documentElement.dataset.view = route === null ? 'home' : 'project'
  }, [route])
  return (
    <>
      <SkipLink />
      <Stage />
      <Header />
      <main id="main" tabIndex={-1}>
        {route === null ? <Home /> : <ProjectPage chapter={route} />}
      </main>
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
