'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { type Locale, type Translations, getTranslation } from './translations'

// ============================================
// Context Types
// ============================================
interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

// ============================================
// Context
// ============================================
const I18nContext = createContext<I18nContextType | undefined>(undefined)

// ============================================
// Provider
// ============================================
interface I18nProviderProps {
  children: ReactNode
  defaultLocale?: Locale
}

export function I18nProvider({ children, defaultLocale = 'en' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [translations, setTranslations] = useState<Translations>(getTranslation(defaultLocale))

  // Load saved locale from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem('verchem-locale') as Locale | null
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'th')) {
      setLocaleState(savedLocale)
      setTranslations(getTranslation(savedLocale))
    }
  }, [])

  // Save locale to localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    setTranslations(getTranslation(newLocale))
    localStorage.setItem('verchem-locale', newLocale)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations }}>
      {children}
    </I18nContext.Provider>
  )
}

// ============================================
// Hook
// ============================================
export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// ============================================
// Language Switcher Component
// ============================================
export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          locale === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLocale('th')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          locale === 'th'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-label="เปลี่ยนเป็นภาษาไทย"
      >
        TH
      </button>
    </div>
  )
}
