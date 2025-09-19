/**
 * Hook for tracking date rendering usage and errors
 * Implements observability for date localization rollout
 */

import { useCallback } from 'react'
import { useAnalytics } from './useAnalytics'
import { useFeatureFlags } from './useFeatureFlags'
import { RegionPrefs } from '@/utils/date'

interface DateRenderMetrics {
  route: string
  componentName: string
  dateKind: 'datetime' | 'dateOnly' | 'relative'
  formatSuccess: boolean
  errorType?: string
  errorMessage?: string
  userRegion?: RegionPrefs
  processingTimeMs?: number
}

export const useDateRenderTracking = () => {
  const { track } = useAnalytics()
  const { getConfig } = useFeatureFlags()

  const shouldSample = useCallback(async (): Promise<boolean> => {
    try {
      const samplingRate = await getConfig('date_render_sampling_rate') || 1.0
      return Math.random() * 100 < samplingRate
    } catch {
      return Math.random() * 100 < 1.0 // Default 1% sampling
    }
  }, [getConfig])

  const trackDateRender = useCallback(async (metrics: DateRenderMetrics) => {
    try {
      if (!(await shouldSample())) {
        return // Skip sampling
      }

      await track('DATE_RENDER_GATEWAY_USED', {
        route: metrics.route,
        component: metrics.componentName,
        date_kind: metrics.dateKind,
        format_success: metrics.formatSuccess,
        error_type: metrics.errorType,
        error_message: metrics.errorMessage,
        user_locale: metrics.userRegion?.locale,
        user_timezone: metrics.userRegion?.timezone,
        processing_time_ms: metrics.processingTimeMs,
        timestamp: new Date().toISOString()
      })

      // Track errors separately for monitoring
      if (!metrics.formatSuccess && metrics.errorType) {
        await track('DATE_FORMAT_ERROR', {
          error_type: metrics.errorType,
          route: metrics.route,
          component: metrics.componentName,
          error_message: metrics.errorMessage,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      // Silent fail - don't break UI for metrics
      console.warn('Failed to track date render metrics:', error)
    }
  }, [track, shouldSample])

  const trackTimezoneError = useCallback(async (errorDetails: {
    errorType: 'Intl' | 'TimeZone' | 'Format'
    errorMessage: string
    route: string
    componentName: string
    userRegion?: RegionPrefs
  }) => {
    try {
      await track('TIMEZONE_ERROR_SENTINEL', {
        error_type: errorDetails.errorType,
        error_message: errorDetails.errorMessage,
        route: errorDetails.route,
        component: errorDetails.componentName,
        user_locale: errorDetails.userRegion?.locale,
        user_timezone: errorDetails.userRegion?.timezone,
        timestamp: new Date().toISOString(),
        severity: 'high'
      })
    } catch (error) {
      console.warn('Failed to track timezone error:', error)
    }
  }, [track])

  return {
    trackDateRender,
    trackTimezoneError
  }
}