'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, getTranslation, getDirection } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Load saved language preference from localStorage
    const saved = localStorage.getItem('language') as Language | null
    if (saved && ['en', 'he', 'es', 'fr', 'ar'].includes(saved)) {
      setLanguageState(saved)
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized) {
      // Save language preference
      localStorage.setItem('language', language)
      // Update document direction
      document.documentElement.dir = getDirection(language)
      document.documentElement.lang = language
    }
  }, [language, isInitialized])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = (key: string, params?: Record<string, string | number>) => {
    return getTranslation(language, key, params)
  }

  const dir = getDirection(language)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
