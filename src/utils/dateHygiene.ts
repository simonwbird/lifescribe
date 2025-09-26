/**
 * Date hygiene utilities - ensuring timezone-safe date handling for UI widgets
 */

import { DateTime } from 'luxon'
import type { SupportedLocale } from '@/lib/i18n/types'
import { getCurrentLocale, getLocaleConfig } from '@/lib/i18n'

/**
 * Safe date parsing that preserves date-only values without timezone shifts
 */
export function parseDate(dateString: string, userTimezone?: string): DateTime {
  const locale = getCurrentLocale()
  const config = getLocaleConfig(locale)
  const timezone = userTimezone || config.timezone

  // Handle date-only strings (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Parse as date-only, don't apply timezone conversion
    return DateTime.fromISO(dateString, { zone: 'utc' })
  }

  // Handle full ISO strings with timezone conversion
  if (dateString.includes('T') || dateString.includes('Z')) {
    return DateTime.fromISO(dateString).setZone(timezone)
  }

  // Fallback to local timezone
  return DateTime.fromISO(dateString, { zone: timezone })
}

/**
 * Get upcoming events without timezone corruption
 */
export function getUpcomingDates(
  events: Array<{ date: string; type: string; title: string }>,
  daysAhead: number = 30,
  userTimezone?: string
): Array<{ date: string; type: string; title: string; daysUntil: number }> {
  const locale = getCurrentLocale()
  const config = getLocaleConfig(locale)
  const timezone = userTimezone || config.timezone
  
  const now = DateTime.now().setZone(timezone)
  const futureLimit = now.plus({ days: daysAhead })

  return events
    .map(event => {
      const eventDate = parseDate(event.date, timezone)
      
      // For birthdays/anniversaries, we need to consider this year's occurrence
      if (event.type === 'birthday' || event.type === 'anniversary') {
        const thisYear = eventDate.set({ year: now.year })
        const nextYear = eventDate.set({ year: now.year + 1 })
        
        // Use this year's date if it hasn't passed, otherwise next year
        const relevantDate = thisYear >= now ? thisYear : nextYear
        
        return {
          ...event,
          date: relevantDate.toISODate() || event.date,
          daysUntil: Math.ceil(relevantDate.diff(now, 'days').days)
        }
      }
      
      // For other events, use the actual date
      return {
        ...event,
        daysUntil: Math.ceil(eventDate.diff(now, 'days').days)
      }
    })
    .filter(event => {
      const eventDate = parseDate(event.date, timezone)
      return eventDate >= now && eventDate <= futureLimit
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

/**
 * Format date for upcoming events display
 */
export function formatUpcomingDate(
  dateString: string,
  locale?: SupportedLocale,
  userTimezone?: string
): string {
  const currentLocale = locale || getCurrentLocale()
  const config = getLocaleConfig(currentLocale)
  const timezone = userTimezone || config.timezone
  
  const date = parseDate(dateString, timezone)
  const now = DateTime.now().setZone(timezone)
  
  const daysUntil = Math.ceil(date.diff(now, 'days').days)
  
  if (daysUntil === 0) {
    return 'Today'
  } else if (daysUntil === 1) {
    return 'Tomorrow'
  } else if (daysUntil <= 7) {
    return date.toFormat('cccc', { locale: currentLocale }) // Day name
  } else if (daysUntil <= 30) {
    return `in ${daysUntil} days`
  } else {
    return date.toLocaleString(DateTime.DATE_MED, { locale: currentLocale })
  }
}

/**
 * Calculate age without timezone issues
 */
export function calculateAge(
  birthDateString: string,
  referenceDate?: Date,
  userTimezone?: string
): number {
  const locale = getCurrentLocale()
  const config = getLocaleConfig(locale)
  const timezone = userTimezone || config.timezone
  
  const birthDate = parseDate(birthDateString, timezone)
  const reference = referenceDate 
    ? DateTime.fromJSDate(referenceDate).setZone(timezone)
    : DateTime.now().setZone(timezone)
  
  return Math.floor(reference.diff(birthDate, 'years').years)
}

/**
 * Calculate days until next birthday/anniversary
 */
export function daysUntilNextOccurrence(
  dateString: string,
  userTimezone?: string
): number {
  const locale = getCurrentLocale()
  const config = getLocaleConfig(locale)
  const timezone = userTimezone || config.timezone
  
  const originalDate = parseDate(dateString, timezone)
  const now = DateTime.now().setZone(timezone)
  
  // Get this year's occurrence
  const thisYear = originalDate.set({ year: now.year })
  
  // If this year's occurrence has passed, use next year
  const nextOccurrence = thisYear >= now ? thisYear : originalDate.set({ year: now.year + 1 })
  
  return Math.ceil(nextOccurrence.diff(now, 'days').days)
}

/**
 * Check if a date string represents today (timezone-aware)
 */
export function isToday(dateString: string, userTimezone?: string): boolean {
  const locale = getCurrentLocale()
  const config = getLocaleConfig(locale)
  const timezone = userTimezone || config.timezone
  
  const date = parseDate(dateString, timezone)
  const now = DateTime.now().setZone(timezone)
  
  return date.toISODate() === now.toISODate()
}

/**
 * Ensure proper timezone handling for widget updates
 */
export function createTimezoneAwareRefresh(
  refreshCallback: () => void,
  intervalMinutes: number = 5
): () => void {
  let intervalId: NodeJS.Timeout
  
  const startRefresh = () => {
    // Clear any existing interval
    if (intervalId) {
      clearInterval(intervalId)
    }
    
    // Set up new interval
    intervalId = setInterval(refreshCallback, intervalMinutes * 60 * 1000)
  }
  
  // Start immediately
  startRefresh()
  
  // Listen for timezone changes
  const handleTimezoneChange = () => {
    startRefresh()
    refreshCallback() // Immediate refresh on timezone change
  }
  
  window.addEventListener('locale-changed', handleTimezoneChange)
  
  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId)
    }
    window.removeEventListener('locale-changed', handleTimezoneChange)
  }
}