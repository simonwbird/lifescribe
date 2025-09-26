/**
 * Main internationalization module
 */

import type { SupportedLocale, TranslationKeys, LocaleConfig } from './types'
import { enGB } from './locales/en-GB'
import { enUS } from './locales/en-US'
import { LOCALE_CONFIGS } from './formats'

// Translation dictionaries
const translations: Record<SupportedLocale, Partial<TranslationKeys>> = {
  'en-GB': enGB,
  'en-US': enUS,
  'fr-FR': enGB, // Fallback to English for now
  'de-DE': enGB, // Fallback to English for now
  'es-ES': enGB, // Fallback to English for now
  'it-IT': enGB  // Fallback to English for now
}

/**
 * Get current user locale from various sources
 */
export function getCurrentLocale(): SupportedLocale {
  // Try to get from user settings first
  const storedLocale = localStorage.getItem('user-locale') as SupportedLocale
  if (storedLocale && translations[storedLocale]) {
    return storedLocale
  }

  // Detect from browser
  const browserLocale = navigator.language as SupportedLocale
  if (translations[browserLocale]) {
    return browserLocale
  }

  // Check browser language family (en-* -> en-GB)
  const languageFamily = browserLocale.split('-')[0]
  const matchingLocale = Object.keys(translations).find(locale => 
    locale.startsWith(languageFamily)
  ) as SupportedLocale

  return matchingLocale || 'en-GB' // Default to British English
}

/**
 * Get locale configuration
 */
export function getLocaleConfig(locale?: SupportedLocale): LocaleConfig {
  const currentLocale = locale || getCurrentLocale()
  return LOCALE_CONFIGS[currentLocale] || LOCALE_CONFIGS['en-GB']
}

/**
 * Translate a key to the current locale
 */
export function t(key: keyof TranslationKeys, locale?: SupportedLocale): string {
  const currentLocale = locale || getCurrentLocale()
  const translation = translations[currentLocale]?.[key]
  
  if (!translation) {
    // Fallback to en-GB if key not found
    const fallback = translations['en-GB']?.[key]
    if (fallback) {
      console.warn(`Translation missing for key "${key}" in locale "${currentLocale}"`)
      return fallback
    }
    
    // Last resort: return the key itself
    console.warn(`Translation missing for key "${key}" in all locales`)
    return key
  }
  
  return translation
}

/**
 * Get translated month names
 */
export function getMonthNames(locale?: SupportedLocale): string[] {
  const currentLocale = locale || getCurrentLocale()
  
  return [
    t('months.january', currentLocale),
    t('months.february', currentLocale),
    t('months.march', currentLocale),
    t('months.april', currentLocale),
    t('months.may', currentLocale),
    t('months.june', currentLocale),
    t('months.july', currentLocale),
    t('months.august', currentLocale),
    t('months.september', currentLocale),
    t('months.october', currentLocale),
    t('months.november', currentLocale),
    t('months.december', currentLocale)
  ]
}

/**
 * Get translated day names
 */
export function getDayNames(locale?: SupportedLocale): string[] {
  const currentLocale = locale || getCurrentLocale()
  
  return [
    t('days.monday', currentLocale),
    t('days.tuesday', currentLocale),
    t('days.wednesday', currentLocale),
    t('days.thursday', currentLocale),
    t('days.friday', currentLocale),
    t('days.saturday', currentLocale),
    t('days.sunday', currentLocale)
  ]
}

/**
 * Set user locale preference
 */
export function setLocale(locale: SupportedLocale): void {
  if (!translations[locale]) {
    console.warn(`Unsupported locale: ${locale}`)
    return
  }
  
  localStorage.setItem('user-locale', locale)
  
  // Dispatch event for components to update
  window.dispatchEvent(new CustomEvent('locale-changed', { 
    detail: { locale } 
  }))
}

/**
 * Hook for React components to use translations
 */
export function useTranslation(locale?: SupportedLocale) {
  const currentLocale = locale || getCurrentLocale()
  
  return {
    t: (key: keyof TranslationKeys) => t(key, currentLocale),
    locale: currentLocale,
    setLocale,
    getMonthNames: () => getMonthNames(currentLocale),
    getDayNames: () => getDayNames(currentLocale)
  }
}

// Re-export types and utilities
export * from './types'
export * from './formats'