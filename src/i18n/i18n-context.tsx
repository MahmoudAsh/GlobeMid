import { ar as arLocale } from 'date-fns/locale'
import { Direction } from 'radix-ui'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setDateLocale } from '@/lib/dates'
import { ar } from './ar'
import { en, type Dict } from './en'

export type Lang = 'en' | 'ar'
const KEY = 'leave-tracker-lang'
const DICTS: Record<Lang, Dict> = { en, ar }

interface I18nState {
  lang: Lang
  dir: 'ltr' | 'rtl'
  t: Dict
  setLang: (l: Lang) => void
}

const I18nContext = createContext<I18nState | null>(null)

function initialLang(): Lang {
  try {
    return localStorage.getItem(KEY) === 'ar' ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  // Set synchronously so every date formatted during this render uses the right language.
  setDateLocale(lang === 'ar' ? arLocale : undefined)

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    document.title = DICTS[lang].appName
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang, dir])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const value = useMemo(() => ({ lang, dir, t: DICTS[lang], setLang }) as const, [lang, dir, setLang])

  return (
    <I18nContext.Provider value={value}>
      <Direction.Provider dir={dir}>{children}</Direction.Provider>
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
