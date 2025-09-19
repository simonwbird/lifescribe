/**
 * Tests for browser detection utilities
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { 
  detectBrowserRegion, 
  detectTimezoneMismatch, 
  formatTimezone,
  getSuggestedRegion 
} from '../browserDetection'

// Mock browser APIs
const mockIntl = {
  DateTimeFormat: vi.fn()
}

const mockNavigator = {
  language: 'en-US',
  languages: ['en-US', 'en']
}

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks()
  
  // Mock Intl.DateTimeFormat
  global.Intl = mockIntl as any
  mockIntl.DateTimeFormat.mockReturnValue({
    resolvedOptions: () => ({ timeZone: 'America/New_York' }),
    formatToParts: () => [
      { type: 'timeZoneName', value: 'EST' }
    ]
  })
  
  // Mock navigator
  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true
  })
})

describe('detectBrowserRegion', () => {
  test('detects US region correctly', () => {
    const result = detectBrowserRegion()
    
    expect(result).toEqual({
      locale: 'en-US',
      timezone: 'America/New_York',
      country: 'US',
      confidence: 'high'
    })
  })
  
  test('handles UK locale', () => {
    mockNavigator.language = 'en-GB'
    mockIntl.DateTimeFormat.mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'Europe/London' })
    })
    
    const result = detectBrowserRegion()
    
    expect(result.locale).toBe('en-GB')
    expect(result.timezone).toBe('Europe/London')
    expect(result.country).toBe('GB')
  })
  
  test('falls back gracefully on error', () => {
    mockIntl.DateTimeFormat.mockImplementation(() => {
      throw new Error('Not supported')
    })
    
    const result = detectBrowserRegion()
    
    expect(result.locale).toBe('en-US')
    expect(result.timezone).toBe('UTC')
    expect(result.country).toBe('US')
    expect(result.confidence).toBe('low')
  })
})

describe('detectTimezoneMismatch', () => {
  test('detects mismatch correctly', () => {
    mockIntl.DateTimeFormat.mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'America/Los_Angeles' })
    })
    
    const hasMismatch = detectTimezoneMismatch('America/New_York')
    expect(hasMismatch).toBe(true)
  })
  
  test('detects no mismatch when timezones match', () => {
    mockIntl.DateTimeFormat.mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'America/New_York' })
    })
    
    const hasMismatch = detectTimezoneMismatch('America/New_York')
    expect(hasMismatch).toBe(false)
  })
})

describe('formatTimezone', () => {
  test('formats timezone with abbreviation and offset', () => {
    mockIntl.DateTimeFormat.mockReturnValue({
      formatToParts: () => [
        { type: 'timeZoneName', value: 'EST' }
      ]
    })
    
    const formatted = formatTimezone('America/New_York')
    expect(formatted).toContain('America/New York')
    expect(formatted).toContain('EST')
  })
})

describe('getSuggestedRegion', () => {
  test('returns suggested region based on browser detection', () => {
    const suggested = getSuggestedRegion()
    
    expect(suggested).toHaveProperty('locale')
    expect(suggested).toHaveProperty('timezone')
    expect(suggested).toHaveProperty('country')
  })
})