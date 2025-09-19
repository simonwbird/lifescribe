/**
 * Centralized date/time formatting utilities for localization
 * Replaces all ad-hoc toLocaleString calls throughout the app
 */

import { DateTime } from 'luxon'

export type DateKind = 'datetime' | 'dateOnly' | 'relative'

export interface RegionPrefs {
  locale: string        // e.g., 'en-GB'
  timezone: string      // e.g., 'Europe/London'
  dateFormatPreference?: string // e.g., 'dd/MM/yyyy'
}

/**
 * Format any date/time for display to the user
 * This is the primary function all UI components should use
 */
export function formatForUser(
  isoOrYmd: string,
  kind: DateKind,
  user: RegionPrefs,
  opts?: { withSeconds?: boolean }
): string {
  if (!isoOrYmd) return ''
  
  try {
    switch (kind) {
      case 'dateOnly':
        return formatDateOnly(isoOrYmd, user)
      case 'datetime':
        return formatDateTime(isoOrYmd, user, opts)
      case 'relative':
        return formatRelative(isoOrYmd, user)
      default:
        return isoOrYmd
    }
  } catch (error) {
    console.warn('Date formatting error:', error, { isoOrYmd, kind, user })
    return isoOrYmd // Fallback to original string
  }
}

/**
 * Format date-only values (birthdays, anniversaries) - NO timezone math
 * Input: YYYY-MM-DD string
 * Output: Locale-appropriate date string
 */
function formatDateOnly(ymd: string, user: RegionPrefs): string {
  const parsed = parseDateOnly(ymd)
  if (!parsed) return ymd
  
  // Create date in local timezone to avoid shifting
  const date = new Date(parsed.y, parsed.m - 1, parsed.d)
  
  // Use custom format if specified, otherwise locale default
  if (user.dateFormatPreference) {
    return formatWithCustomPattern(date, user.dateFormatPreference, user.locale)
  }
  
  return new Intl.DateTimeFormat(user.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

/**
 * Format datetime values (created_at, timestamps) with timezone conversion
 * Input: UTC ISO 8601 string
 * Output: Locale and timezone appropriate datetime string
 */
function formatDateTime(
  isoString: string, 
  user: RegionPrefs, 
  opts?: { withSeconds?: boolean }
): string {
  const dt = DateTime.fromISO(isoString, { zone: 'utc' })
  if (!dt.isValid) return isoString
  
  const inUserTz = dt.setZone(user.timezone)
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(opts?.withSeconds && { second: '2-digit' }),
    timeZoneName: 'short'
  }
  
  return new Intl.DateTimeFormat(user.locale, formatOptions).format(inUserTz.toJSDate())
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * Input: UTC ISO 8601 string or YYYY-MM-DD
 * Output: Relative time string in user's locale
 */
function formatRelative(isoOrYmd: string, user: RegionPrefs): string {
  let dt: DateTime
  
  // Handle both ISO datetimes and date-only strings
  if (isoOrYmd.includes('T') || isoOrYmd.includes('Z')) {
    // ISO datetime - convert from UTC to user timezone
    dt = DateTime.fromISO(isoOrYmd, { zone: 'utc' }).setZone(user.timezone)
  } else {
    // Date-only string - parse in user timezone
    const parsed = parseDateOnly(isoOrYmd)
    if (!parsed) return isoOrYmd
    dt = DateTime.fromObject({ 
      year: parsed.y, 
      month: parsed.m, 
      day: parsed.d 
    }, { zone: user.timezone })
  }
  
  if (!dt.isValid) return isoOrYmd
  
  const now = DateTime.now().setZone(user.timezone)
  const diff = dt.diff(now, ['years', 'months', 'days', 'hours', 'minutes'])
  
  const rtf = new Intl.RelativeTimeFormat(user.locale, { numeric: 'auto' })
  
  // Find the largest non-zero unit
  if (Math.abs(diff.years) >= 1) {
    return rtf.format(Math.round(diff.years), 'year')
  } else if (Math.abs(diff.months) >= 1) {
    return rtf.format(Math.round(diff.months), 'month')
  } else if (Math.abs(diff.days) >= 1) {
    return rtf.format(Math.round(diff.days), 'day')
  } else if (Math.abs(diff.hours) >= 1) {
    return rtf.format(Math.round(diff.hours), 'hour')
  } else {
    return rtf.format(Math.round(diff.minutes), 'minute')
  }
}

/**
 * Convert various date inputs to UTC ISO 8601 string
 * Use this when ingesting user input or storing to database
 */
export function toUtcIso(input: string, tzGuess?: string): string {
  if (!input) return ''
  
  try {
    // If already looks like UTC ISO, return as-is
    if (input.endsWith('Z') || input.includes('+')) {
      const dt = DateTime.fromISO(input)
      return dt.isValid ? dt.toUTC().toISO()! : input
    }
    
    // If date-only format, keep as date-only
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input // Don't convert date-only to datetime
    }
    
    // Assume local datetime if no timezone info
    const zone = tzGuess || 'UTC'
    const dt = DateTime.fromISO(input, { zone })
    
    return dt.isValid ? dt.toUTC().toISO()! : input
  } catch (error) {
    console.warn('Date conversion error:', error, { input, tzGuess })
    return input
  }
}

/**
 * Parse date-only string (YYYY-MM-DD) to components - NO timezone math
 * Use this for birthdays, anniversaries, etc.
 */
export function parseDateOnly(ymd: string): { y: number; m: number; d: number } | null {
  if (!ymd || typeof ymd !== 'string') return null
  
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  
  const [, yearStr, monthStr, dayStr] = match
  const y = parseInt(yearStr, 10)
  const m = parseInt(monthStr, 10)
  const d = parseInt(dayStr, 10)
  
  // Basic validation
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
    return null
  }
  
  return { y, m, d }
}

/**
 * Format date with custom pattern (internal helper)
 */
function formatWithCustomPattern(date: Date, pattern: string, locale: string): string {
  // Simple pattern replacement - extend as needed
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear().toString()
  
  return pattern
    .replace(/dd/g, day)
    .replace(/MM/g, month)
    .replace(/yyyy/g, year)
    .replace(/mm/g, month) // Also support lowercase
}

/**
 * Helper to get current user's region preferences
 * TODO: Connect to user profile once authentication is integrated
 */
export function getCurrentUserRegion(): RegionPrefs {
  // Default fallback - in production, fetch from user's profile
  return {
    locale: 'en-US',
    timezone: 'UTC'
  }
}

/**
 * Common region presets for testing and defaults
 */
export const REGION_PRESETS = {
  US: { locale: 'en-US', timezone: 'America/New_York' },
  UK: { locale: 'en-GB', timezone: 'Europe/London' },
  CA: { locale: 'en-CA', timezone: 'America/Toronto' },
  AU: { locale: 'en-AU', timezone: 'Australia/Sydney' },
  FR: { locale: 'fr-FR', timezone: 'Europe/Paris' },
  DE: { locale: 'de-DE', timezone: 'Europe/Berlin' },
} as const

/**
 * Validate region preferences
 */
export function isValidRegionPrefs(prefs: any): prefs is RegionPrefs {
  return (
    prefs &&
    typeof prefs.locale === 'string' &&
    typeof prefs.timezone === 'string' &&
    prefs.locale.match(/^[a-z]{2}-[A-Z]{2}$/) &&
    prefs.timezone.length > 0
  )
}
