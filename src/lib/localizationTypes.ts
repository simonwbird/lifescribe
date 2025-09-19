/**
 * Types for user localization preferences
 */

export interface UserLocale {
  locale: string // BCP-47 (e.g., 'en-US', 'en-GB', 'fr-FR')
  timezone: string // IANA (e.g., 'America/New_York', 'Europe/London')
  country: string // ISO 3166-1 alpha-2 (e.g., 'US', 'GB', 'FR')
  dateFormatPreference?: string | null // Optional override (e.g., 'dd/MM/yyyy')
}

export interface LocalizedDateOptions {
  locale?: string
  timezone?: string
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  timeStyle?: 'full' | 'long' | 'medium' | 'short'
  showTime?: boolean
  showTimeZone?: boolean
}

export const DEFAULT_LOCALES = {
  'US': { locale: 'en-US', timezone: 'America/New_York', country: 'US' },
  'GB': { locale: 'en-GB', timezone: 'Europe/London', country: 'GB' },
  'CA': { locale: 'en-CA', timezone: 'America/Toronto', country: 'CA' },
  'AU': { locale: 'en-AU', timezone: 'Australia/Sydney', country: 'AU' },
  'FR': { locale: 'fr-FR', timezone: 'Europe/Paris', country: 'FR' },
  'DE': { locale: 'de-DE', timezone: 'Europe/Berlin', country: 'DE' },
} as const

export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Australia/Melbourne',
] as const

export const SUPPORTED_LOCALES = [
  { code: 'en-US', name: 'English (US)', country: 'US' },
  { code: 'en-GB', name: 'English (UK)', country: 'GB' },
  { code: 'en-CA', name: 'English (Canada)', country: 'CA' },
  { code: 'en-AU', name: 'English (Australia)', country: 'AU' },
  { code: 'fr-FR', name: 'Français (France)', country: 'FR' },
  { code: 'de-DE', name: 'Deutsch (Deutschland)', country: 'DE' },
] as const