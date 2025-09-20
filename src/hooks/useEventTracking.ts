import { useCallback } from 'react'
import { eventTracker } from '@/lib/eventTrackingService'
import type { 
  UserSignedUpMetadata,
  MemoryRecordedMetadata,
  MediaUploadedMetadata,
  TranscriptionCompletedMetadata,
  PersonAddedMetadata,
  InviteSentMetadata,
  InviteAcceptedMetadata,
  ImportantDateAddedMetadata,
  DigestScheduledMetadata,
  DigestSentMetadata,
  ContentFlaggedMetadata,
  ModActionAppliedMetadata,
  ExportRequestedMetadata,
  ExportCompletedMetadata,
  RtbfRequestedMetadata,
  RtbfExecutedMetadata,
  PreflightNoneMetadata,
  PreflightPossibleShownMetadata,
  CreateAbandonedMetadata,
  CreateCompletedMetadata,
  ProvisionalVerifiedMetadata
} from '@/lib/eventTypes'

/**
 * React hook for consistent event tracking across components
 * 
 * Usage:
 * const { trackMemoryRecorded, trackPersonAdded } = useEventTracking()
 * 
 * trackMemoryRecorded({
 *   story_type: 'text',
 *   content_length: 150,
 *   privacy_level: 'family',
 *   capture_method: 'web'
 * })
 */
export function useEventTracking() {
  const trackUserSignedUp = useCallback(async (metadata: UserSignedUpMetadata) => {
    await eventTracker.trackUserSignedUp(metadata)
  }, [])

  const trackMemoryRecorded = useCallback(async (metadata: MemoryRecordedMetadata) => {
    await eventTracker.trackMemoryRecorded(metadata)
  }, [])

  const trackMediaUploaded = useCallback(async (metadata: MediaUploadedMetadata) => {
    await eventTracker.trackMediaUploaded(metadata)
  }, [])

  const trackTranscriptionCompleted = useCallback(async (metadata: TranscriptionCompletedMetadata) => {
    await eventTracker.trackTranscriptionCompleted(metadata)
  }, [])

  const trackPersonAdded = useCallback(async (metadata: PersonAddedMetadata) => {
    await eventTracker.trackPersonAdded(metadata)
  }, [])

  const trackInviteSent = useCallback(async (metadata: InviteSentMetadata) => {
    await eventTracker.trackInviteSent(metadata)
  }, [])

  const trackInviteAccepted = useCallback(async (metadata: InviteAcceptedMetadata) => {
    await eventTracker.trackInviteAccepted(metadata)
  }, [])

  const trackImportantDateAdded = useCallback(async (metadata: ImportantDateAddedMetadata) => {
    await eventTracker.trackImportantDateAdded(metadata)
  }, [])

  const trackDigestScheduled = useCallback(async (metadata: DigestScheduledMetadata) => {
    await eventTracker.trackDigestScheduled(metadata)
  }, [])

  const trackDigestSent = useCallback(async (metadata: DigestSentMetadata) => {
    await eventTracker.trackDigestSent(metadata)
  }, [])

  const trackContentFlagged = useCallback(async (metadata: ContentFlaggedMetadata) => {
    await eventTracker.trackContentFlagged(metadata)
  }, [])

  const trackModActionApplied = useCallback(async (metadata: ModActionAppliedMetadata) => {
    await eventTracker.trackModActionApplied(metadata)
  }, [])

  const trackExportRequested = useCallback(async (metadata: ExportRequestedMetadata) => {
    await eventTracker.trackExportRequested(metadata)
  }, [])

  const trackExportCompleted = useCallback(async (metadata: ExportCompletedMetadata) => {
    await eventTracker.trackExportCompleted(metadata)
  }, [])

  const trackRtbfRequested = useCallback(async (metadata: RtbfRequestedMetadata) => {
    await eventTracker.trackRtbfRequested(metadata)
  }, [])

  const trackRtbfExecuted = useCallback(async (metadata: RtbfExecutedMetadata) => {
    await eventTracker.trackRtbfExecuted(metadata)
  }, [])

  const trackPreflightNone = useCallback(async (metadata: PreflightNoneMetadata) => {
    await eventTracker.trackPreflightNone(metadata)
  }, [])

  const trackPreflightPossibleShown = useCallback(async (metadata: PreflightPossibleShownMetadata) => {
    await eventTracker.trackPreflightPossibleShown(metadata)
  }, [])

  const trackCreateAbandoned = useCallback(async (metadata: CreateAbandonedMetadata) => {
    await eventTracker.trackCreateAbandoned(metadata)
  }, [])

  const trackCreateCompleted = useCallback(async (metadata: CreateCompletedMetadata) => {
    await eventTracker.trackCreateCompleted(metadata)
  }, [])

  const trackProvisionalVerified = useCallback(async (metadata: ProvisionalVerifiedMetadata) => {
    await eventTracker.trackProvisionalVerified(metadata)
  }, [])

  const trackCustomEvent = useCallback(async (eventName: string, metadata: Record<string, any>) => {
    await eventTracker.trackCustomEvent(eventName, metadata)
  }, [])

  return {
    trackUserSignedUp,
    trackMemoryRecorded,
    trackMediaUploaded,
    trackTranscriptionCompleted,
    trackPersonAdded,
    trackInviteSent,
    trackInviteAccepted,
    trackImportantDateAdded,
    trackDigestScheduled,
    trackDigestSent,
    trackContentFlagged,
    trackModActionApplied,
    trackExportRequested,
    trackExportCompleted,
    trackRtbfRequested,
    trackRtbfExecuted,
    trackPreflightNone,
    trackPreflightPossibleShown,
    trackCreateAbandoned,
    trackCreateCompleted,
    trackProvisionalVerified,
    trackCustomEvent
  }
}