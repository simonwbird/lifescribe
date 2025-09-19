/**
 * Data & Events Spine - Standardized event tracking for analytics and audit
 * 
 * All events should be emitted consistently with:
 * - user_id: UUID of the acting user
 * - family_id: UUID of the relevant family/space
 * - actor_role: Role of the user performing the action
 * - metadata: Event-specific additional data
 */

// Standardized event names - use these exact constants
export const ANALYTICS_EVENTS = {
  // Core User Actions
  USER_SIGNED_UP: 'USER_SIGNED_UP',
  MEMORY_RECORDED: 'MEMORY_RECORDED',
  MEDIA_UPLOADED: 'MEDIA_UPLOADED',
  TRANSCRIPTION_COMPLETED: 'TRANSCRIPTION_COMPLETED',
  PERSON_ADDED: 'PERSON_ADDED',
  INVITE_SENT: 'INVITE_SENT',
  INVITE_ACCEPTED: 'INVITE_ACCEPTED',
  IMPORTANT_DATE_ADDED: 'IMPORTANT_DATE_ADDED',
  
  // Engagement & Communication
  DIGEST_SCHEDULED: 'DIGEST_SCHEDULED',
  DIGEST_SENT: 'DIGEST_SENT',
  
  // Moderation & Safety
  CONTENT_FLAGGED: 'CONTENT_FLAGGED',
  MOD_ACTION_APPLIED: 'MOD_ACTION_APPLIED',
  
  // Compliance & Privacy
  EXPORT_REQUESTED: 'EXPORT_REQUESTED',
  EXPORT_COMPLETED: 'EXPORT_COMPLETED',
  RTBF_REQUESTED: 'RTBF_REQUESTED',
  RTBF_EXECUTED: 'RTBF_EXECUTED',
} as const

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS

// Base interface for all events
export interface BaseEventData {
  user_id: string
  family_id: string | null
  actor_role: 'admin' | 'member' | 'system' | 'super_admin'
  session_id?: string
  ip_address?: string
  user_agent?: string
}

// Event-specific metadata interfaces
export interface UserSignedUpMetadata {
  signup_method: 'email' | 'google' | 'apple' | 'invite_link'
  invite_token?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export interface MemoryRecordedMetadata {
  story_type: 'text' | 'voice' | 'video' | 'photo'
  content_length?: number
  tags?: string[]
  privacy_level: 'family' | 'private' | 'descendants'
  capture_method: 'web' | 'mobile' | 'phone_import'
}

export interface MediaUploadedMetadata {
  file_type: string
  file_size_bytes: number
  upload_method: 'drag_drop' | 'file_picker' | 'camera' | 'phone_import'
  processing_required: boolean
  attached_to: 'story' | 'answer' | 'recipe' | 'property' | 'standalone'
}

export interface TranscriptionCompletedMetadata {
  audio_duration_seconds: number
  word_count: number
  confidence_score: number
  vendor_used: string
  processing_time_ms: number
  cost_usd: number
}

export interface PersonAddedMetadata {
  method: 'manual' | 'gedcom_import' | 'ai_suggestion'
  relationship_type?: string
  has_photo: boolean
  has_birth_date: boolean
  generation_relative_to_user?: number
}

export interface InviteSentMetadata {
  invite_method: 'email' | 'link_share' | 'sms'
  recipient_role: 'admin' | 'member'
  relationship_to_inviter?: string
  expires_in_hours: number
}

export interface InviteAcceptedMetadata {
  time_to_accept_hours: number
  invite_method: 'email' | 'link_share' | 'sms'
  first_action_after_signup?: string
}

export interface ImportantDateAddedMetadata {
  event_type: 'birthday' | 'anniversary' | 'death' | 'custom'
  person_count: number
  has_photo: boolean
  recurrence: 'yearly' | 'none'
}

export interface DigestScheduledMetadata {
  digest_type: 'weekly' | 'monthly' | 'custom'
  recipient_count: number
  content_item_count: number
  scheduled_for: string
}

export interface DigestSentMetadata {
  digest_type: 'weekly' | 'monthly' | 'custom'
  recipient_count: number
  content_item_count: number
  send_method: 'email' | 'push'
  template_version: string
}

export interface ContentFlaggedMetadata {
  content_type: 'story' | 'comment' | 'media' | 'answer'
  flag_reason: string
  flagged_by_type: 'user' | 'ai' | 'system'
  severity_score: number
  auto_action_taken?: string
}

export interface ModActionAppliedMetadata {
  action_type: 'hide' | 'delete' | 'warn' | 'suspend' | 'approve'
  content_type: 'story' | 'comment' | 'media' | 'answer'
  moderator_id: string
  appeal_available: boolean
  rationale: string
}

export interface ExportRequestedMetadata {
  export_type: 'full' | 'stories_only' | 'media_only'
  requested_format: 'zip' | 'json'
  estimated_size_mb: number
  estimated_items: number
}

export interface ExportCompletedMetadata {
  export_type: 'full' | 'stories_only' | 'media_only'
  final_size_mb: number
  total_items: number
  processing_time_seconds: number
  download_expires_at: string
}

export interface RtbfRequestedMetadata {
  impact_analysis: {
    stories_affected: number
    media_affected: number
    families_affected: number
    total_items: number
  }
  confirmation_method: 'email' | 'phone' | 'in_person'
  legal_basis: string
}

export interface RtbfExecutedMetadata {
  items_deleted: {
    stories: number
    media: number
    comments: number
    answers: number
    other: number
  }
  execution_time_seconds: number
  confirmation_sent: boolean
  backup_retention_days: number
}

// Union type for all possible metadata
export type EventMetadata =
  | UserSignedUpMetadata
  | MemoryRecordedMetadata
  | MediaUploadedMetadata
  | TranscriptionCompletedMetadata
  | PersonAddedMetadata
  | InviteSentMetadata
  | InviteAcceptedMetadata
  | ImportantDateAddedMetadata
  | DigestScheduledMetadata
  | DigestSentMetadata
  | ContentFlaggedMetadata
  | ModActionAppliedMetadata
  | ExportRequestedMetadata
  | ExportCompletedMetadata
  | RtbfRequestedMetadata
  | RtbfExecutedMetadata
  | Record<string, any> // Fallback for custom metadata

// Complete event payload
export interface AnalyticsEvent extends BaseEventData {
  event_name: string
  metadata: EventMetadata
  created_at?: string
}