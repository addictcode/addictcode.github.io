import { Contact, Footer } from './components/Contact'
import { Header } from './components/Header'
import { Journey } from './components/Journey'
import { StackBand } from './components/StackBand'
import { Works } from './components/Works'
import { LangProvider, useLang } from './i18n/LangContext'

function SkipLink() {
  const { t } = useLang()
  return (
    <a className="skip" href="#works">
      {t.ui.skip}
    </a>
  )
}

export default function App() {
  return (
    <LangProvider>
      <SkipLink />
      <Header />
      <main id="main">
        <Journey />
        <StackBand />
        <Works />
        <Contact />
      </main>
      <Footer />
    </LangProvider>
  )
}
