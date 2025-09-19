/**
 * Enhanced date formatting utilities with observability tracking
 * Wraps the core formatForUser function with metrics and error handling
 */

import { formatForUser as coreFormatForUser, DateKind, RegionPrefs } from './date'
import { useDateRenderTracking } from '@/hooks/useDateRenderTracking'
import { useLocation } from 'react-router-dom'

// Component name context for tracking
let currentComponentName = 'Unknown'

export const setCurrentComponent = (componentName: string) => {
  currentComponentName = componentName
}

export const getCurrentComponent = () => currentComponentName

/**
 * Enhanced formatForUser with tracking and error handling
 */
export function formatForUserWithTracking(
  isoOrYmd: string,
  kind: DateKind,
  user: RegionPrefs,
  opts?: { withSeconds?: boolean },
  componentName?: string
): string {
  const startTime = performance.now()
  const route = window.location.pathname
  const component = componentName || currentComponentName

  try {
    const result = coreFormatForUser(isoOrYmd, kind, user, opts)
    const processingTime = performance.now() - startTime

    // Track successful render (async, non-blocking)
    trackSuccessfulRender({
      route,
      componentName: component,
      dateKind: kind,
      processingTimeMs: processingTime,
      userRegion: user
    })

    return result
  } catch (error) {
    const processingTime = performance.now() - startTime
    
    // Determine error type for sentinel monitoring
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorType = getErrorType(errorMessage)

    // Track error (async, non-blocking)
    trackFormatError({
      route,
      componentName: component,
      dateKind: kind,
      errorType,
      errorMessage,
      processingTimeMs: processingTime,
      userRegion: user
    })

    // Return fallback
    console.warn(`Date formatting error in ${component}:`, error)
    return isoOrYmd || ''
  }
}

function getErrorType(errorMessage: string): string {
  if (errorMessage.includes('Intl') || errorMessage.includes('Invalid locale')) {
    return 'Intl'
  }
  if (errorMessage.includes('timezone') || errorMessage.includes('Invalid time zone')) {
    return 'TimeZone'
  }
  return 'Format'
}

// Async tracking functions (non-blocking)
function trackSuccessfulRender(metrics: {
  route: string
  componentName: string
  dateKind: DateKind
  processingTimeMs: number
  userRegion: RegionPrefs
}) {
  // Use requestIdleCallback for non-blocking tracking
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      sendTrackingData({
        ...metrics,
        formatSuccess: true
      })
    })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      sendTrackingData({
        ...metrics,
        formatSuccess: true
      })
    }, 0)
  }
}

function trackFormatError(metrics: {
  route: string
  componentName: string
  dateKind: DateKind
  errorType: string
  errorMessage: string
  processingTimeMs: number
  userRegion: RegionPrefs
}) {
  // Immediate tracking for errors (important for monitoring)
  sendTrackingData({
    ...metrics,
    formatSuccess: false
  })
}

function sendTrackingData(metrics: {
  route: string
  componentName: string
  dateKind: DateKind
  formatSuccess: boolean
  errorType?: string
  errorMessage?: string
  processingTimeMs: number
  userRegion: RegionPrefs
}) {
  // This will be called from the tracking hook when available
  // For now, we'll use a global tracking function if available
  if (typeof (window as any).__trackDateRender === 'function') {
    (window as any).__trackDateRender(metrics)
  }
}

// Hook to set up tracking in components
export const useDateFormatTracking = () => {
  const { trackDateRender, trackTimezoneError } = useDateRenderTracking()

  // Set up global tracking function
  if (typeof window !== 'undefined') {
    (window as any).__trackDateRender = trackDateRender
  }

  return {
    formatForUser: formatForUserWithTracking,
    setComponentName: setCurrentComponent,
    trackTimezoneError
  }
}

// Re-export core function for backward compatibility
export { formatForUser } from './date'
export type { DateKind, RegionPrefs } from './date'