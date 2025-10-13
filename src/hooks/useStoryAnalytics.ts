import { useCallback, useRef } from 'react'
import { useAnalyticsContext } from '@/components/analytics/AnalyticsProvider'

export interface StoryAnalyticsEvents {
  trackComposerOpened: (mode: string, promptId?: string, promptTitle?: string) => void
  trackModeSelected: (mode: string) => void
  trackAssetUploaded: (assetType: string, fileSize: number) => void
  trackPeopleTagged: (count: number) => void
  trackPublished: (storyId: string, promptId?: string, mode?: string) => void
  trackProcessingComplete: (storyId: string, processingTimeMs: number) => void
}

export function useStoryAnalytics(familyId: string): StoryAnalyticsEvents {
  const analytics = useAnalyticsContext()
  const startTime = useRef<number>(Date.now())

  const trackComposerOpened = useCallback((mode: string, promptId?: string, promptTitle?: string) => {
    startTime.current = Date.now()
    analytics.track({
      event_name: 'composer_opened',
      family_id: familyId,
      properties: {
        mode,
        prompt_id: promptId,
        prompt_title: promptTitle,
        timestamp: new Date().toISOString()
      }
    })
  }, [analytics, familyId])

  const trackModeSelected = useCallback((mode: string) => {
    analytics.track({
      event_name: 'mode_selected',
      family_id: familyId,
      properties: {
        mode,
        timestamp: new Date().toISOString()
      }
    })
  }, [analytics, familyId])

  const trackAssetUploaded = useCallback((assetType: string, fileSize: number) => {
    analytics.track({
      event_name: 'asset_uploaded',
      family_id: familyId,
      properties: {
        asset_type: assetType,
        file_size: fileSize,
        timestamp: new Date().toISOString()
      }
    })
  }, [analytics, familyId])

  const trackPeopleTagged = useCallback((count: number) => {
    analytics.track({
      event_name: 'people_tagged',
      family_id: familyId,
      properties: {
        count,
        timestamp: new Date().toISOString()
      }
    })
  }, [analytics, familyId])

  const trackPublished = useCallback((storyId: string, promptId?: string, mode?: string) => {
    const timeToPublish = Date.now() - startTime.current
    analytics.track({
      event_name: 'published',
      family_id: familyId,
      properties: {
        story_id: storyId,
        prompt_id: promptId,
        mode,
        time_to_publish_ms: timeToPublish,
        timestamp: new Date().toISOString()
      }
    })
  }, [analytics, familyId])

  const trackProcessingComplete = useCallback((storyId: string, processingTimeMs: number) => {
    analytics.track({
      event_name: 'processing_complete',
      family_id: familyId,
      properties: {
        story_id: storyId,
        processing_time_ms: processingTimeMs,
        timestamp: new Date().toISOString()
      }
    })
  }, [analytics, familyId])

  return {
    trackComposerOpened,
    trackModeSelected,
    trackAssetUploaded,
    trackPeopleTagged,
    trackPublished,
    trackProcessingComplete
  }
}
