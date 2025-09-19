/**
 * Browser detection utilities for locale and timezone
 */

import { SUPPORTED_LOCALES, DEFAULT_LOCALES, type UserLocale } from '@/lib/localizationTypes'

export interface BrowserRegionInfo {
  locale: string
  timezone: string
  country: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Detect user's region preferences from browser
 */
export function detectBrowserRegion(): BrowserRegionInfo {
  try {
    // Get timezone from Intl API
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Get locale from browser
    const browserLocale = navigator.language || navigator.languages?.[0] || 'en-US'
    
    // Normalize locale to supported format
    const normalizedLocale = normalizeLocale(browserLocale)
    
    // Infer country from locale or timezone
    const country = inferCountry(normalizedLocale, timezone)
    
    return {
      locale: normalizedLocale,
      timezone,
      country,
      confidence: 'high'
    }
  } catch (error) {
    console.warn('Failed to detect browser region:', error)
    return {
      locale: 'en-US',
      timezone: 'UTC',
      country: 'US',
      confidence: 'low'
    }
  }
}

/**
 * Normalize browser locale to supported BCP-47 format
 */
function normalizeLocale(browserLocale: string): string {
  // Handle various browser locale formats
  const normalized = browserLocale.replace('_', '-')
  
  // Check if we support this exact locale
  const supported = SUPPORTED_LOCALES.find(l => l.code === normalized)
  if (supported) {
    return supported.code
  }
  
  // Try to match by language only
  const language = normalized.split('-')[0]
  const languageMatch = SUPPORTED_LOCALES.find(l => l.code.startsWith(language))
  if (languageMatch) {
    return languageMatch.code
  }
  
  return 'en-US' // Default fallback
}

/**
 * Infer country from locale or timezone
 */
function inferCountry(locale: string, timezone: string): string {
  // First try to get country from locale
  const localeCountry = locale.split('-')[1]
  if (localeCountry && localeCountry.length === 2) {
    return localeCountry.toUpperCase()
  }
  
  // Try to infer from timezone
  const timezoneCountry = inferCountryFromTimezone(timezone)
  if (timezoneCountry) {
    return timezoneCountry
  }
  
  return 'US' // Default fallback
}

/**
 * Map common timezones to countries
 */
function inferCountryFromTimezone(timezone: string): string | null {
  const timezoneCountryMap: Record<string, string> = {
    // North America
    'America/New_York': 'US',
    'America/Chicago': 'US', 
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    
    // Europe
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Amsterdam': 'NL',
    'Europe/Rome': 'IT',
    'Europe/Madrid': 'ES',
    
    // Asia Pacific
    'Asia/Tokyo': 'JP',
    'Asia/Shanghai': 'CN',
    'Asia/Hong_Kong': 'HK',
    'Asia/Singapore': 'SG',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
  }
  
  return timezoneCountryMap[timezone] || null
}

/**
 * Check if current browser timezone differs from saved timezone
 */
export function detectTimezoneMismatch(savedTimezone: string): boolean {
  try {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return browserTimezone !== savedTimezone
  } catch (error) {
    return false
  }
}

/**
 * Get user-friendly timezone display name
 */
export function formatTimezone(timezone: string): string {
  try {
    // Get timezone offset and abbreviation
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    })
    
    const parts = formatter.formatToParts(now)
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || ''
    
    // Get offset
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
    const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    const offsetMinutes = (localDate.getTime() - utcDate.getTime()) / (1000 * 60)
    const offsetHours = offsetMinutes / 60
    
    const offsetSign = offsetHours >= 0 ? '+' : ''
    const offsetFormatted = `UTC${offsetSign}${offsetHours}`
    
    return `${timezone.replace('_', ' ')} (${timeZoneName}, ${offsetFormatted})`
  } catch (error) {
    return timezone
  }
}

/**
 * Get suggested region based on browser detection
 */
export function getSuggestedRegion(): UserLocale {
  const detected = detectBrowserRegion()
  
  // Use country-specific defaults if available
  const countryDefaults = DEFAULT_LOCALES[detected.country as keyof typeof DEFAULT_LOCALES]
  if (countryDefaults) {
    return {
      ...countryDefaults,
      timezone: detected.timezone // Use detected timezone over default
    }
  }
  
  return {
    locale: detected.locale,
    timezone: detected.timezone,
    country: detected.country
  }
}