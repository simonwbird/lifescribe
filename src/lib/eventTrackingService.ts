import { supabase } from '@/lib/supabase'
import { getCurrentSpaceId } from '@/lib/spaceUtils'
import { 
  ANALYTICS_EVENTS, 
  type AnalyticsEvent, 
  type BaseEventData,
  type EventMetadata,
  type UserSignedUpMetadata,
  type MemoryRecordedMetadata,
  type MediaUploadedMetadata,
  type TranscriptionCompletedMetadata,
  type PersonAddedMetadata,
  type InviteSentMetadata,
  type InviteAcceptedMetadata,
  type ImportantDateAddedMetadata,
  type DigestScheduledMetadata,
  type DigestSentMetadata,
  type ContentFlaggedMetadata,
  type ModActionAppliedMetadata,
  type ExportRequestedMetadata,
  type ExportCompletedMetadata,
  type RtbfRequestedMetadata,
  type RtbfExecutedMetadata
} from './eventTypes'

/**
 * Centralized Event Tracking Service
 * 
 * Provides type-safe, consistent event tracking across the entire application.
 * All events are automatically enriched with required metadata and sent to both
 * analytics_events table and audit_log where appropriate.
 */
class EventTrackingService {
  private async getBaseEventData(): Promise<Partial<BaseEventData>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return {}

      // Get user's role and family context
      const { data: profile } = await supabase
        .from('profiles')
        .select('settings, default_space_id')
        .eq('id', user.id)
        .single()

      const familyId = await getCurrentSpaceId()
      
      // Determine actor role
      let actorRole: BaseEventData['actor_role'] = 'member'
      const settings = profile?.settings as any
      if (settings?.role === 'super_admin') {
        actorRole = 'super_admin'
      } else if (familyId) {
        // Check if user is admin of current family
        const { data: membership } = await supabase
          .from('members')
          .select('role')
          .eq('profile_id', user.id)
          .eq('family_id', familyId)
          .single()
        
        if (membership?.role === 'admin') {
          actorRole = 'admin'
        }
      }

      return {
        user_id: user.id,
        family_id: familyId,
        actor_role: actorRole,
        session_id: crypto.randomUUID(), // Simple session tracking
      }
    } catch (error) {
      console.error('Failed to get base event data:', error)
      return {}
    }
  }

  private async emitEvent(eventName: string, metadata: EventMetadata): Promise<void> {
    try {
      const baseData = await this.getBaseEventData()
      
      if (!baseData.user_id) {
        console.warn('Cannot track event without authenticated user:', eventName)
        return
      }

      const eventPayload = {
        event_name: eventName,
        user_id: baseData.user_id,
        family_id: baseData.family_id,
        properties: {
          ...metadata,
          actor_role: baseData.actor_role,
          session_id: baseData.session_id,
          timestamp: new Date().toISOString(),
        }
      }

      // Insert into analytics_events table
      const { error } = await supabase
        .from('analytics_events')
        .insert(eventPayload)

      if (error) {
        console.error('Failed to track analytics event:', error)
      }

      // For audit-worthy events, also log to audit_log
      if (this.isAuditableEvent(eventName)) {
        await this.logAuditEvent(eventName, metadata, baseData)
      }

    } catch (error) {
      console.error('Failed to emit event:', eventName, error)
    }
  }

  private isAuditableEvent(eventName: string): boolean {
    // Events that should also go to audit log for compliance
    const auditableEvents = [
      ANALYTICS_EVENTS.USER_SIGNED_UP,
      ANALYTICS_EVENTS.PERSON_ADDED,
      ANALYTICS_EVENTS.INVITE_SENT,
      ANALYTICS_EVENTS.INVITE_ACCEPTED,
      ANALYTICS_EVENTS.CONTENT_FLAGGED,
      ANALYTICS_EVENTS.MOD_ACTION_APPLIED,
      ANALYTICS_EVENTS.EXPORT_REQUESTED,
      ANALYTICS_EVENTS.EXPORT_COMPLETED,
      ANALYTICS_EVENTS.RTBF_REQUESTED,
      ANALYTICS_EVENTS.RTBF_EXECUTED,
    ]
    return auditableEvents.includes(eventName as any)
  }

  private async logAuditEvent(eventName: string, metadata: EventMetadata, baseData: Partial<BaseEventData>): Promise<void> {
    try {
      // Use the existing audit log function - simplified for now
      await supabase.rpc('log_audit_event', {
        p_actor_id: baseData.user_id,
        p_action: 'OTHER' as any, // Simplified - map to generic action for now
        p_entity_type: this.getEntityTypeFromEvent(eventName),
        p_entity_id: null, // Simplified for now
        p_family_id: baseData.family_id,
        p_details: metadata as any, // Cast to any to handle JSON type
        p_actor_type: baseData.actor_role === 'system' ? 'system' : 'user'
      })
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  private mapEventToAuditAction(eventName: string): string {
    const mapping: Record<string, string> = {
      [ANALYTICS_EVENTS.USER_SIGNED_UP]: 'create',
      [ANALYTICS_EVENTS.PERSON_ADDED]: 'create',
      [ANALYTICS_EVENTS.INVITE_SENT]: 'create',
      [ANALYTICS_EVENTS.INVITE_ACCEPTED]: 'update',
      [ANALYTICS_EVENTS.CONTENT_FLAGGED]: 'flag',
      [ANALYTICS_EVENTS.MOD_ACTION_APPLIED]: 'moderate',
      [ANALYTICS_EVENTS.EXPORT_REQUESTED]: 'export',
      [ANALYTICS_EVENTS.EXPORT_COMPLETED]: 'export',
      [ANALYTICS_EVENTS.RTBF_REQUESTED]: 'delete',
      [ANALYTICS_EVENTS.RTBF_EXECUTED]: 'delete',
    }
    return mapping[eventName] || 'other'
  }

  private getEntityTypeFromEvent(eventName: string): string {
    const mapping: Record<string, string> = {
      [ANALYTICS_EVENTS.USER_SIGNED_UP]: 'profile',
      [ANALYTICS_EVENTS.PERSON_ADDED]: 'person',
      [ANALYTICS_EVENTS.INVITE_SENT]: 'invite',
      [ANALYTICS_EVENTS.INVITE_ACCEPTED]: 'invite',
      [ANALYTICS_EVENTS.CONTENT_FLAGGED]: 'content',
      [ANALYTICS_EVENTS.MOD_ACTION_APPLIED]: 'content',
      [ANALYTICS_EVENTS.EXPORT_REQUESTED]: 'export',
      [ANALYTICS_EVENTS.EXPORT_COMPLETED]: 'export',
      [ANALYTICS_EVENTS.RTBF_REQUESTED]: 'profile',
      [ANALYTICS_EVENTS.RTBF_EXECUTED]: 'profile',
    }
    return mapping[eventName] || 'unknown'
  }

  // Type-safe event tracking methods
  async trackUserSignedUp(metadata: UserSignedUpMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.USER_SIGNED_UP, metadata)
  }

  async trackMemoryRecorded(metadata: MemoryRecordedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.MEMORY_RECORDED, metadata)
  }

  async trackMediaUploaded(metadata: MediaUploadedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.MEDIA_UPLOADED, metadata)
  }

  async trackTranscriptionCompleted(metadata: TranscriptionCompletedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.TRANSCRIPTION_COMPLETED, metadata)
  }

  async trackPersonAdded(metadata: PersonAddedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.PERSON_ADDED, metadata)
  }

  async trackInviteSent(metadata: InviteSentMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.INVITE_SENT, metadata)
  }

  async trackInviteAccepted(metadata: InviteAcceptedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.INVITE_ACCEPTED, metadata)
  }

  async trackImportantDateAdded(metadata: ImportantDateAddedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.IMPORTANT_DATE_ADDED, metadata)
  }

  async trackDigestScheduled(metadata: DigestScheduledMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.DIGEST_SCHEDULED, metadata)
  }

  async trackDigestSent(metadata: DigestSentMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.DIGEST_SENT, metadata)
  }

  async trackContentFlagged(metadata: ContentFlaggedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.CONTENT_FLAGGED, metadata)
  }

  async trackModActionApplied(metadata: ModActionAppliedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.MOD_ACTION_APPLIED, metadata)
  }

  async trackExportRequested(metadata: ExportRequestedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.EXPORT_REQUESTED, metadata)
  }

  async trackExportCompleted(metadata: ExportCompletedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.EXPORT_COMPLETED, metadata)
  }

  async trackRtbfRequested(metadata: RtbfRequestedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.RTBF_REQUESTED, metadata)
  }

  async trackRtbfExecuted(metadata: RtbfExecutedMetadata): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.RTBF_EXECUTED, metadata)
  }

  // Generic method for custom events (with less type safety)
  async trackCustomEvent(eventName: string, metadata: Record<string, any>): Promise<void> {
    await this.emitEvent(eventName, metadata)
  }
}

// Export singleton instance
export const eventTracker = new EventTrackingService()

// Export individual tracking functions for convenience
export const {
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
  trackCustomEvent
} = eventTracker