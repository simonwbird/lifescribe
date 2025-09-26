/**
 * React hook for locale management and formatting
 */

import { useState, useEffect } from 'react'
import { getCurrentLocale, getLocaleConfig, t, setLocale, type SupportedLocale, type TranslationKeys } from '@/lib/i18n'
import { formatDate, formatTime, formatCurrency, formatAddress, formatRelativeTime, formatAge, formatNumber } from '@/lib/i18n/formats'
import type { DateFormatOptions, CurrencyFormatOptions, AddressFormatOptions } from '@/lib/i18n/types'

export function useLocale() {
  const [locale, setCurrentLocale] = useState<SupportedLocale>(getCurrentLocale())
  const [config, setConfig] = useState(getLocaleConfig(locale))

  useEffect(() => {
    const handleLocaleChange = (event: CustomEvent) => {
      const newLocale = event.detail.locale as SupportedLocale
      setCurrentLocale(newLocale)
      setConfig(getLocaleConfig(newLocale))
    }

    window.addEventListener('locale-changed', handleLocaleChange as EventListener)
    return () => {
      window.removeEventListener('locale-changed', handleLocaleChange as EventListener)
    }
  }, [])

  const translate = (key: keyof TranslationKeys) => t(key, locale)

  const formatters = {
    date: (date: Date | string, options?: DateFormatOptions) => 
      formatDate(date, locale, options),
    
    time: (date: Date | string, options?: DateFormatOptions) => 
      formatTime(date, locale, options),
    
    currency: (amount: number, options?: CurrencyFormatOptions) => 
      formatCurrency(amount, locale, options),
    
    address: (
      address: {
        street?: string
        city?: string
        region?: string
        postalCode?: string
        country?: string
      },
      options?: AddressFormatOptions
    ) => formatAddress(address, locale, options),
    
    relativeTime: (date: Date | string, baseDate?: Date) => 
      formatRelativeTime(date, locale, baseDate),
    
    age: (birthDate: Date | string, currentDate?: Date) => 
      formatAge(birthDate, locale, currentDate),
    
    number: (value: number, options?: Intl.NumberFormatOptions) => 
      formatNumber(value, locale, options)
  }

  const getMonthOptions = () => {
    const monthNames = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2000, i, 1)
      return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date)
    })
    
    return monthNames.map((name, index) => ({
      value: (index + 1).toString(),
      label: name
    }))
  }

  const getDayOptions = () => {
    return Array.from({ length: 31 }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString()
    }))
  }

  const isRTL = config.rtl || false
  const use24Hour = config.dateFormat.use24Hour
  const timezone = config.timezone
  const currency = config.currency

  return {
    locale,
    config,
    setLocale,
    t: translate,
    format: formatters,
    getMonthOptions,
    getDayOptions,
    isRTL,
    use24Hour,
    timezone,
    currency
  }
}