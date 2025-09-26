/**
 * Locale context provider for the application
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentLocale, setLocale as setGlobalLocale, type SupportedLocale } from '@/lib/i18n'

interface LocaleContextValue {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocaleContext() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocaleContext must be used within LocaleProvider')
  }
  return context
}

interface LocaleProviderProps {
  children: React.ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(getCurrentLocale())

  useEffect(() => {
    const handleLocaleChange = (event: CustomEvent) => {
      setLocaleState(event.detail.locale)
    }

    window.addEventListener('locale-changed', handleLocaleChange as EventListener)
    return () => {
      window.removeEventListener('locale-changed', handleLocaleChange as EventListener)
    }
  }, [])

  const setLocale = (newLocale: SupportedLocale) => {
    setGlobalLocale(newLocale)
    setLocaleState(newLocale)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}