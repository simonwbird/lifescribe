import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'

type AnalyticsEvent = 
  | 'page_view'
  | 'block_add'
  | 'block_reorder'
  | 'story_publish'
  | 'guestbook_submit'
  | 'memorialize'
  | 'indexability_change'

interface AnalyticsProperties {
  person_id?: string
  preset?: 'life' | 'tribute'
  viewer_role?: string
  device?: 'mobile' | 'tablet' | 'desktop'
  locale?: string
  block_type?: string
  indexability?: string
  [key: string]: any
}

interface AnalyticsConfig {
  userId?: string
  familyId?: string
}

/**
 * Privacy-respecting analytics hook
 * - No PII tracking
 * - 100% sampling for first 30 days, 20% afterward
 * - Events fire once per session
 */
export function usePrivacyAnalytics({ userId, familyId }: AnalyticsConfig = {}) {
  const trackedEvents = useRef<Set<string>>(new Set())
  const userCreatedAt = useRef<Date | null>(null)

  useEffect(() => {
    // Get user creation date for sampling logic
    const getUserCreationDate = async () => {
      if (!userId) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single()
      
      if (profile?.created_at) {
        userCreatedAt.current = new Date(profile.created_at)
      }
    }

    getUserCreationDate()
  }, [userId])

  const shouldSample = useCallback((): boolean => {
    if (!userCreatedAt.current) return true // Sample if we don't know user age
    
    const now = new Date()
    const daysSinceCreation = Math.floor(
      (now.getTime() - userCreatedAt.current.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // 100% sampling for first 30 days
    if (daysSinceCreation <= 30) return true
    
    // 20% sampling afterward
    return Math.random() < 0.2
  }, [])

  const getDevice = (): 'mobile' | 'tablet' | 'desktop' => {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  const trackEvent = useCallback(async (
    eventName: AnalyticsEvent,
    properties: AnalyticsProperties = {}
  ) => {
    // Create session-unique key for deduplication
    const eventKey = `${eventName}-${JSON.stringify(properties)}`
    
    // Check if event already tracked in this session
    if (trackedEvents.current.has(eventKey)) {
      return
    }

    // Apply sampling
    if (!shouldSample()) {
      return
    }

    // Mark as tracked
    trackedEvents.current.add(eventKey)

    try {
      // Enrich with dimensions (no PII)
      const enrichedProperties: AnalyticsProperties = {
        ...properties,
        device: getDevice(),
        locale: navigator.language,
        timestamp: new Date().toISOString(),
        // Remove any potential PII
        user_email: undefined,
        user_name: undefined,
        ip_address: undefined
      }

      // Track to analytics_events table
      await supabase
        .from('analytics_events')
        .insert({
          event_name: eventName,
          user_id: userId || null,
          family_id: familyId || null,
          properties: enrichedProperties
        })
    } catch (error) {
      console.error('Analytics error:', error)
      // Fail silently - analytics should never break the app
    }
  }, [userId, familyId, shouldSample])

  // Convenience methods for specific events
  const trackPageView = useCallback((personId: string, preset?: 'life' | 'tribute') => {
    trackEvent('page_view', { person_id: personId, preset })
  }, [trackEvent])

  const trackBlockAdd = useCallback((personId: string, blockType: string, preset?: 'life' | 'tribute') => {
    trackEvent('block_add', { person_id: personId, block_type: blockType, preset })
  }, [trackEvent])

  const trackBlockReorder = useCallback((personId: string, preset?: 'life' | 'tribute') => {
    trackEvent('block_reorder', { person_id: personId, preset })
  }, [trackEvent])

  const trackStoryPublish = useCallback((personId: string, preset?: 'life' | 'tribute') => {
    trackEvent('story_publish', { person_id: personId, preset })
  }, [trackEvent])

  const trackGuestbookSubmit = useCallback((personId: string) => {
    trackEvent('guestbook_submit', { person_id: personId })
  }, [trackEvent])

  const trackMemorialize = useCallback((personId: string) => {
    trackEvent('memorialize', { person_id: personId })
  }, [trackEvent])

  const trackIndexabilityChange = useCallback((personId: string, indexability: string) => {
    trackEvent('indexability_change', { person_id: personId, indexability })
  }, [trackEvent])

  return {
    trackEvent,
    trackPageView,
    trackBlockAdd,
    trackBlockReorder,
    trackStoryPublish,
    trackGuestbookSubmit,
    trackMemorialize,
    trackIndexabilityChange
  }
}
