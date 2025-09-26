import { useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'
import { AnalyticsEvent } from '@/types/analytics'
import { v4 as uuidv4 } from 'uuid'

export function useEnhancedAnalytics() {
  const { user, session } = useAuth()
  const sessionId = useRef(uuidv4())
  const eventQueue = useRef<AnalyticsEvent[]>([])
  const flushTimer = useRef<NodeJS.Timeout>()

  // Generate new session ID on mount
  useEffect(() => {
    sessionId.current = uuidv4()
  }, [])

  // Flush events periodically
  useEffect(() => {
    const flush = async () => {
      if (eventQueue.current.length === 0) return

      const events = [...eventQueue.current]
      eventQueue.current = []

      try {
        const { error } = await supabase
          .from('analytics_events')
          .insert(events.map(event => ({
            event_name: event.event_name,
            user_id: event.user_id || user?.id,
            family_id: event.family_id,
            properties: {
              ...event.properties,
              session_id: sessionId.current,
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          })))

        if (error) {
          console.error('Analytics flush error:', error)
          // Re-queue events on failure
          eventQueue.current.unshift(...events)
        }
      } catch (error) {
        console.error('Analytics flush exception:', error)
        eventQueue.current.unshift(...events)
      }
    }

    flushTimer.current = setInterval(flush, 5000) // Flush every 5 seconds
    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current)
      flush() // Flush remaining events on cleanup
    }
  }, [user?.id])

  const track = useCallback((event: any) => {
    // Add to queue for batch processing
    eventQueue.current.push({
      ...event,
      user_id: event.user_id || user?.id,
      timestamp: new Date().toISOString(),
      properties: {
        ...event.properties,
        session_id: sessionId.current
      }
    })

    // Immediate flush for critical events
    const criticalEvents = ['story_save', 'invite_accept', 'streak_continue']
    if (criticalEvents.includes(event.event_name) && eventQueue.current.length > 0) {
      const events = [...eventQueue.current]
      eventQueue.current = []
      
      supabase
        .from('analytics_events')
        .insert(events.map(e => ({
          event_name: e.event_name,
          user_id: e.user_id || user?.id,
          family_id: e.family_id,
          properties: e.properties
        })))
        .then(({ error }) => {
          if (error) {
            console.error('Critical analytics error:', error)
            eventQueue.current.unshift(...events)
          }
        })
    }
  }, [user?.id])

  // Specialized tracking methods
  const trackPromptView = useCallback((promptId: string, type: string, position: number, source: string) => {
    track({
      event_name: 'prompt_view',
      properties: {
        prompt_id: promptId,
        prompt_type: type as any,
        position,
        source: source as any,
        session_id: sessionId.current
      }
    })
  }, [track])

  const trackPromptShuffle = useCallback((previousPrompts: string[], newPrompts: string[], shuffleCount: number) => {
    track({
      event_name: 'prompt_shuffle',
      properties: {
        previous_prompts: previousPrompts,
        new_prompts: newPrompts,
        shuffle_count: shuffleCount,
        session_id: sessionId.current
      }
    })
  }, [track])

  const trackStoryStart = useCallback((storyType: string, promptId?: string, source = 'unknown') => {
    track({
      event_name: 'story_start',
      properties: {
        prompt_id: promptId,
        story_type: storyType as any,
        source: source as any,
        session_id: sessionId.current
      }
    })
  }, [track])

  const trackStorySave = useCallback((storyId: string, storyType: string, promptId?: string, contentLength = 0, timeToComplete = 0) => {
    track({
      event_name: 'story_save',
      properties: {
        story_id: storyId,
        story_type: storyType as any,
        prompt_id: promptId,
        content_length: contentLength,
        time_to_complete: timeToComplete,
        session_id: sessionId.current
      }
    })
  }, [track])

  const trackStreakContinue = useCallback((streakCount: number, daysSinceLast: number, milestoneReached = false) => {
    track({
      event_name: 'streak_continue',
      properties: {
        streak_count: streakCount,
        days_since_last_story: daysSinceLast,
        milestone_reached: milestoneReached,
        session_id: sessionId.current
      }
    })
  }, [track])

  const trackInviteSend = useCallback((method: string, recipientCount: number, source: string) => {
    track({
      event_name: 'invite_send',
      properties: {
        invite_method: method as any,
        recipient_count: recipientCount,
        source: source as any,
        session_id: sessionId.current
      }
    })
  }, [track])

  const trackInviteAccept = useCallback((inviteToken: string, inviteAgeHours: number, signupMethod: string) => {
    track({
      event_name: 'invite_accept',
      properties: {
        invite_token: inviteToken,
        invite_age_hours: inviteAgeHours,
        signup_method: signupMethod as any,
        session_id: sessionId.current
      }
    })
  }, [track])

  return {
    track,
    trackPromptView,
    trackPromptShuffle,
    trackStoryStart,
    trackStorySave,
    trackStreakContinue,
    trackInviteSend,
    trackInviteAccept,
    sessionId: sessionId.current
  }
}