/**
 * Locale-specific formatting utilities
 */

import type { SupportedLocale, DateFormatOptions, CurrencyFormatOptions, AddressFormatOptions } from './types'

// Default locale configurations
export const LOCALE_CONFIGS = {
  'en-GB': {
    locale: 'en-GB' as SupportedLocale,
    timezone: 'Europe/London',
    currency: 'GBP',
    dateFormat: {
      dateStyle: 'short' as const, // dd/MM/yyyy
      use24Hour: true,
      showTimezone: false
    },
    addressFormat: {
      style: 'full' as const,
      includeCountry: true
    }
  },
  'en-US': {
    locale: 'en-US' as SupportedLocale,
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: {
      dateStyle: 'short' as const, // MM/dd/yyyy
      use24Hour: false,
      showTimezone: false
    },
    addressFormat: {
      style: 'full' as const,
      includeCountry: false
    }
  },
  'fr-FR': {
    locale: 'fr-FR' as SupportedLocale,
    timezone: 'Europe/Paris',
    currency: 'EUR',
    dateFormat: {
      dateStyle: 'short' as const, // dd/MM/yyyy
      use24Hour: true,
      showTimezone: false
    },
    addressFormat: {
      style: 'full' as const,
      includeCountry: true
    }
  },
  'de-DE': {
    locale: 'de-DE' as SupportedLocale,
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    dateFormat: {
      dateStyle: 'short' as const, // dd.MM.yyyy
      use24Hour: true,
      showTimezone: false
    },
    addressFormat: {
      style: 'full' as const,
      includeCountry: true
    }
  }
} as const

/**
 * Format date according to locale preferences
 */
export function formatDate(
  date: Date | string,
  locale: SupportedLocale,
  options: DateFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const config = LOCALE_CONFIGS[locale]
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: options.dateStyle || config.dateFormat.dateStyle,
    timeStyle: options.timeStyle || undefined,
    timeZone: config.timezone,
    hour12: options.use24Hour !== undefined ? !options.use24Hour : !config.dateFormat.use24Hour
  }

  // Handle timezone display
  if (options.showTimezone) {
    formatOptions.timeZoneName = 'short'
  }

  try {
    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj)
  } catch (error) {
    console.warn('Date formatting failed:', error)
    return dateObj.toLocaleDateString()
  }
}

/**
 * Format time according to locale preferences
 */
export function formatTime(
  date: Date | string,
  locale: SupportedLocale,
  options: DateFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const config = LOCALE_CONFIGS[locale]
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeStyle: options.timeStyle || 'short',
    timeZone: config.timezone,
    hour12: options.use24Hour !== undefined ? !options.use24Hour : !config.dateFormat.use24Hour
  }

  if (options.showTimezone) {
    formatOptions.timeZoneName = 'short'
  }

  try {
    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj)
  } catch (error) {
    console.warn('Time formatting failed:', error)
    return dateObj.toLocaleTimeString()
  }
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  amount: number,
  locale: SupportedLocale,
  options: CurrencyFormatOptions = { currency: 'USD' }
): string {
  const config = LOCALE_CONFIGS[locale]
  const currency = options.currency || config.currency
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: options.display || 'symbol'
    }).format(amount)
  } catch (error) {
    console.warn('Currency formatting failed:', error)
    return `${currency} ${amount.toFixed(2)}`
  }
}

/**
 * Format numbers according to locale
 */
export function formatNumber(
  value: number,
  locale: SupportedLocale,
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value)
  } catch (error) {
    console.warn('Number formatting failed:', error)
    return value.toString()
  }
}

/**
 * Format address according to locale conventions
 */
export function formatAddress(
  address: {
    street?: string
    city?: string
    region?: string // State/Province/County
    postalCode?: string
    country?: string
  },
  locale: SupportedLocale,
  options: AddressFormatOptions = {}
): string {
  const config = LOCALE_CONFIGS[locale]
  const { street, city, region, postalCode, country } = address
  const { style = 'full', includeCountry = config.addressFormat.includeCountry } = options

  const parts: string[] = []

  if (street) parts.push(street)
  
  // Different address formats by locale
  switch (locale) {
    case 'en-GB':
      if (city) parts.push(city)
      if (region && region !== city) parts.push(region)
      if (postalCode) parts.push(postalCode.toUpperCase())
      break
      
    case 'en-US':
      if (city && region) {
        parts.push(`${city}, ${region}`)
      } else if (city || region) {
        parts.push(city || region || '')
      }
      if (postalCode) parts.push(postalCode)
      break
      
    case 'fr-FR':
    case 'de-DE':
      if (postalCode && city) {
        parts.push(`${postalCode} ${city}`)
      } else if (city) {
        parts.push(city)
      }
      if (region && region !== city) parts.push(region)
      break
      
    default:
      if (city) parts.push(city)
      if (region) parts.push(region)
      if (postalCode) parts.push(postalCode)
  }
  
  if (includeCountry && country) {
    parts.push(country)
  }

  return style === 'short' 
    ? parts.slice(-2).join(', ')
    : parts.join(', ')
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(
  date: Date | string,
  locale: SupportedLocale,
  baseDate: Date = new Date()
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diffMs = dateObj.getTime() - baseDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    
    if (Math.abs(diffDays) >= 1) {
      return rtf.format(diffDays, 'day')
    } else if (Math.abs(diffHours) >= 1) {
      return rtf.format(diffHours, 'hour')
    } else {
      return rtf.format(diffMinutes, 'minute')
    }
  } catch (error) {
    console.warn('Relative time formatting failed:', error)
    return diffMs > 0 ? 'future' : 'past'
  }
}

/**
 * Format age display
 */
export function formatAge(
  birthDate: Date | string,
  locale: SupportedLocale,
  currentDate: Date = new Date()
): string {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const age = currentDate.getFullYear() - birth.getFullYear()
  const monthDiff = currentDate.getMonth() - birth.getMonth()
  
  let actualAge = age
  if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birth.getDate())) {
    actualAge--
  }

  return formatNumber(actualAge, locale)
}