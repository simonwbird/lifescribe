/**
 * Unit tests for centralized date formatting utilities
 * Tests GB vs US formatting, DST boundaries, leap days
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { 
  formatForUser, 
  toUtcIso, 
  parseDateOnly, 
  REGION_PRESETS,
  type RegionPrefs 
} from '../date'

describe('Date Utilities', () => {
  const ukUser: RegionPrefs = REGION_PRESETS.UK
  const usUser: RegionPrefs = REGION_PRESETS.US

  describe('formatForUser - dateOnly', () => {
    test('formats birthdays consistently across regions', () => {
      const birthday = '1985-07-15'
      
      const ukFormat = formatForUser(birthday, 'dateOnly', ukUser)
      const usFormat = formatForUser(birthday, 'dateOnly', usUser)
      
      // Both should show same calendar date, different formats
      expect(ukFormat).toContain('July')
      expect(ukFormat).toContain('15')
      expect(ukFormat).toContain('1985')
      
      expect(usFormat).toContain('July')
      expect(usFormat).toContain('15')  
      expect(usFormat).toContain('1985')
    })

    test('handles leap day correctly', () => {
      const leapDay = '2024-02-29'
      
      const ukFormat = formatForUser(leapDay, 'dateOnly', ukUser)
      const usFormat = formatForUser(leapDay, 'dateOnly', usUser)
      
      expect(ukFormat).toContain('February')
      expect(ukFormat).toContain('29')
      expect(ukFormat).toContain('2024')
      
      expect(usFormat).toContain('February')
      expect(usFormat).toContain('29')
      expect(usFormat).toContain('2024')
    })

    test('respects custom date format preference', () => {
      const date = '2023-12-25'
      const customUser = { ...ukUser, dateFormatPreference: 'dd/MM/yyyy' }
      
      const formatted = formatForUser(date, 'dateOnly', customUser)
      expect(formatted).toBe('25/12/2023')
    })
  })

  describe('formatForUser - datetime', () => {
    test('converts UTC to local timezone correctly', () => {
      const utcTime = '2023-07-15T14:30:00Z' // 2:30 PM UTC
      
      const ukFormat = formatForUser(utcTime, 'datetime', ukUser)
      const usFormat = formatForUser(utcTime, 'datetime', usUser)
      
      // UK should show BST (UTC+1) = 3:30 PM 
      expect(ukFormat).toMatch(/15:30|3:30 PM/i)
      
      // US Eastern should show EDT (UTC-4) = 10:30 AM
      expect(usFormat).toMatch(/10:30 AM/i)
    })

    test('handles DST boundary correctly', () => {
      // Spring forward in US: 2023-03-12 2 AM -> 3 AM
      const beforeDST = '2023-03-12T06:30:00Z' // 1:30 AM EST 
      const afterDST = '2023-03-12T07:30:00Z'  // 3:30 AM EDT
      
      const beforeFormat = formatForUser(beforeDST, 'datetime', usUser)
      const afterFormat = formatForUser(afterDST, 'datetime', usUser)
      
      expect(beforeFormat).toMatch(/1:30 AM/i)
      expect(afterFormat).toMatch(/3:30 AM/i)
    })

    test('includes seconds when requested', () => {
      const utcTime = '2023-07-15T14:30:45Z'
      
      const withSeconds = formatForUser(utcTime, 'datetime', usUser, { withSeconds: true })
      const withoutSeconds = formatForUser(utcTime, 'datetime', usUser)
      
      expect(withSeconds).toContain('45')
      expect(withoutSeconds).not.toContain('45')
    })
  })

  describe('formatForUser - relative', () => {
    test('formats relative time in correct locale', () => {
      // Mock "now" as 2023-07-15T12:00:00Z
      const futureTime = '2023-07-17T12:00:00Z' // 2 days in future
      const pastTime = '2023-07-13T12:00:00Z'   // 2 days in past
      
      // Note: Actual relative formatting will depend on when test runs
      // These tests verify the function doesn't crash and returns strings
      const futureUK = formatForUser(futureTime, 'relative', ukUser)
      const futureUS = formatForUser(futureTime, 'relative', usUser)
      const pastUK = formatForUser(pastTime, 'relative', ukUser)
      const pastUS = formatForUser(pastTime, 'relative', usUser)
      
      expect(typeof futureUK).toBe('string')
      expect(typeof futureUS).toBe('string')  
      expect(typeof pastUK).toBe('string')
      expect(typeof pastUS).toBe('string')
    })

    test('handles date-only strings for relative time', () => {
      const dateOnly = '2023-07-15'
      
      const formatted = formatForUser(dateOnly, 'relative', ukUser)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })
  })

  describe('toUtcIso', () => {
    test('preserves already UTC ISO strings', () => {
      const utcIso = '2023-07-15T14:30:00Z'
      expect(toUtcIso(utcIso)).toBe(utcIso)
    })

    test('preserves date-only strings', () => {
      const dateOnly = '2023-07-15'
      expect(toUtcIso(dateOnly)).toBe(dateOnly)
    })

    test('converts local datetime to UTC', () => {
      const localTime = '2023-07-15T14:30:00'
      const result = toUtcIso(localTime, 'America/New_York')
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(result).not.toBe(localTime)
    })
  })

  describe('parseDateOnly', () => {
    test('parses valid date-only strings', () => {
      const result = parseDateOnly('2023-07-15')
      expect(result).toEqual({ y: 2023, m: 7, d: 15 })
    })

    test('rejects invalid formats', () => {
      expect(parseDateOnly('2023/07/15')).toBeNull()
      expect(parseDateOnly('07-15-2023')).toBeNull()
      expect(parseDateOnly('invalid')).toBeNull()
      expect(parseDateOnly('')).toBeNull()
    })

    test('validates date ranges', () => {
      expect(parseDateOnly('1899-01-01')).toBeNull() // Too old
      expect(parseDateOnly('2101-01-01')).toBeNull() // Too far future
      expect(parseDateOnly('2023-13-01')).toBeNull() // Invalid month
      expect(parseDateOnly('2023-01-32')).toBeNull() // Invalid day
    })

    test('handles leap day validation', () => {
      expect(parseDateOnly('2024-02-29')).toEqual({ y: 2024, m: 2, d: 29 }) // Valid leap day
      expect(parseDateOnly('2023-02-29')).toBeNull() // Invalid leap day
    })
  })

  describe('Error handling', () => {
    test('gracefully handles malformed input', () => {
      const badInput = 'not-a-date'
      
      expect(formatForUser(badInput, 'dateOnly', ukUser)).toBe(badInput)
      expect(formatForUser(badInput, 'datetime', ukUser)).toBe(badInput)
      expect(formatForUser(badInput, 'relative', ukUser)).toBe(badInput)
    })

    test('handles empty/null input', () => {
      expect(formatForUser('', 'dateOnly', ukUser)).toBe('')
      expect(formatForUser('', 'datetime', ukUser)).toBe('')
      expect(toUtcIso('')).toBe('')
      expect(parseDateOnly('')).toBeNull()
    })
  })
})

// Snapshot tests for consistent formatting
describe('Date Format Snapshots', () => {
  const testDate = '2023-07-15'
  const testDateTime = '2023-07-15T14:30:00Z'
  
  test('UK formatting snapshots', () => {
    expect(formatForUser(testDate, 'dateOnly', REGION_PRESETS.UK)).toMatchSnapshot('uk-date-only')
    expect(formatForUser(testDateTime, 'datetime', REGION_PRESETS.UK)).toMatchSnapshot('uk-datetime')
  })
  
  test('US formatting snapshots', () => {
    expect(formatForUser(testDate, 'dateOnly', REGION_PRESETS.US)).toMatchSnapshot('us-date-only')
    expect(formatForUser(testDateTime, 'datetime', REGION_PRESETS.US)).toMatchSnapshot('us-datetime')
  })
})