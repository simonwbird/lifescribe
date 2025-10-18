import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface AnalyticsContext {
  user_role: string
  persona_mode: 'standard' | 'elder' | 'guest'
  device: 'mobile' | 'tablet' | 'desktop'
}

/**
 * Analytics hook with automatic context enrichment
 * Tracks user_role, persona_mode, and device for every event
 */
export function useAnalytics(userId?: string) {
  const [context, setContext] = useState<AnalyticsContext>({
    user_role: 'guest',
    persona_mode: 'guest',
    device: getDeviceType(),
  })

  useEffect(() => {
    if (userId) {
      loadUserContext(userId)
    }
  }, [userId])

  async function loadUserContext(uid: string) {
    try {
      // Get user role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', uid)
        .single()

      // Get persona mode from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('elder_mode')
        .eq('id', uid)
        .single()

      setContext({
        user_role: roleData?.role || 'user',
        persona_mode: profileData?.elder_mode ? 'elder' : 'standard',
        device: getDeviceType(),
      })
    } catch (error) {
      console.warn('Analytics context load failed:', error)
    }
  }

  /**
   * Track an analytics event with automatic context enrichment
   */
  const track = async (event_name: string, properties?: Record<string, any>) => {
    const enrichedEvent = {
      event_name,
      properties: {
        ...properties,
        ...context,
        timestamp: new Date().toISOString(),
      },
    }

    try {
      // Get current user ID if not provided
      const { data: { user } } = await supabase.auth.getUser()
      const effectiveUserId = userId || user?.id

      // Insert into analytics_events table
      await supabase.from('analytics_events').insert({
        user_id: effectiveUserId,
        family_id: properties?.family_id || null,
        event_name,
        properties: enrichedEvent.properties,
      })

      // Also log to console in dev
      if (import.meta.env.DEV) {
        console.log('[Analytics]', enrichedEvent)
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error)
    }
  }

  return { track, context }
}

/**
 * Detect device type based on screen width and user agent
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth
  const userAgent = navigator.userAgent.toLowerCase()
  
  // Check for mobile devices
  if (
    /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
    width < 768
  ) {
    return 'mobile'
  }
  
  // Check for tablets
  if (/tablet|ipad|playbook|silk/i.test(userAgent) || (width >= 768 && width < 1024)) {
    return 'tablet'
  }
  
  return 'desktop'
}
