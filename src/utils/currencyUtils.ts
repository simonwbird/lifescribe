/**
 * Currency utilities with locale awareness
 */

import { getCurrentLocale, getLocaleConfig } from '@/lib/i18n'
import { formatCurrency as formatCurrencyIntl } from '@/lib/i18n/formats'
import type { SupportedLocale, CurrencyFormatOptions } from '@/lib/i18n/types'

// Common currency mappings by country/locale
export const CURRENCY_BY_LOCALE: Record<SupportedLocale, string> = {
  'en-GB': 'GBP',
  'en-US': 'USD', 
  'fr-FR': 'EUR',
  'de-DE': 'EUR',
  'es-ES': 'EUR',
  'it-IT': 'EUR'
}

// Currency symbols for display
export const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'GBP': '£',
  'EUR': '€',
  'CAD': 'C$',
  'AUD': 'A$',
  'JPY': '¥',
  'CHF': 'CHF',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr'
}

/**
 * Format currency amount according to user's locale
 */
export function formatCurrency(
  amount: number,
  locale?: SupportedLocale,
  currencyCode?: string,
  options: CurrencyFormatOptions = {}
): string {
  const currentLocale = locale || getCurrentLocale()
  const config = getLocaleConfig(currentLocale)
  const currency = currencyCode || options.currency || config.currency
  
  return formatCurrencyIntl(amount, currentLocale, { 
    currency,
    display: options.display
  })
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode
}

/**
 * Get default currency for a locale
 */
export function getDefaultCurrency(locale?: SupportedLocale): string {
  const currentLocale = locale || getCurrentLocale()
  return CURRENCY_BY_LOCALE[currentLocale] || 'USD'
}

/**
 * Format price ranges
 */
export function formatPriceRange(
  minAmount: number,
  maxAmount: number,
  locale?: SupportedLocale,
  currencyCode?: string
): string {
  if (minAmount === maxAmount) {
    return formatCurrency(minAmount, locale, currencyCode)
  }
  
  const min = formatCurrency(minAmount, locale, currencyCode)
  const max = formatCurrency(maxAmount, locale, currencyCode)
  
  return `${min} - ${max}`
}

/**
 * Parse currency string back to number (for form inputs)
 */
export function parseCurrencyString(
  currencyString: string,
  locale?: SupportedLocale
): number | null {
  const currentLocale = locale || getCurrentLocale()
  
  // Remove currency symbols and non-numeric characters except decimal separators
  let cleaned = currencyString.replace(/[^\d.,\-]/g, '')
  
  // Handle locale-specific decimal separators
  if (currentLocale.startsWith('en')) {
    // English locales use . for decimals
    cleaned = cleaned.replace(/,/g, '')
  } else {
    // Many European locales use , for decimals and . for thousands
    const lastComma = cleaned.lastIndexOf(',')
    const lastDot = cleaned.lastIndexOf('.')
    
    if (lastComma > lastDot) {
      // Comma is the decimal separator
      cleaned = cleaned.substring(0, lastComma).replace(/[.,]/g, '') + '.' + cleaned.substring(lastComma + 1)
    } else {
      // Dot is the decimal separator
      cleaned = cleaned.replace(/,/g, '')
    }
  }
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}