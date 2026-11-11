import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { content, type Content, type Lang } from '../content'

const STORAGE_KEY = 'lang'

interface LangValue {
  lang: Lang
  t: Content
  setLang: (lang: Lang) => void
}

const LangContext = createContext<LangValue | null>(null)

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'ru' || stored === 'en') return stored
  } catch {
    /* хранилище недоступно: остаёмся на языке по умолчанию */
  }
  return 'ru'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* не запомнится, но переключится */
    }
  }, [])

  useEffect(() => {
    const t = content[lang]
    document.documentElement.lang = lang
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
  }, [lang])

  const value = useMemo(() => ({ lang, t: content[lang], setLang }), [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang(): LangValue {
  const value = useContext(LangContext)
  if (!value) throw new Error('useLang вне LangProvider')
  return value
}
