// Base event interface that all events must include
export interface BaseEventData {
  user_id: string
  family_id?: string
  actor_role: 'member' | 'admin' | 'super_admin' | 'system'
  session_id?: string
}

// Core user action events
export interface UserSignedUpMetadata {
  signup_method: 'email' | 'phone' | 'oauth'
  provider?: string
  referral_source?: string
  user_agent?: string
}

export interface MemoryRecordedMetadata {
  story_type: 'text' | 'audio' | 'video' | 'photo'
  content_length: number
  privacy_level: 'private' | 'family' | 'public'
  capture_method: 'web' | 'mobile' | 'import' | 'api'
  has_media: boolean
  media_count?: number
  tags?: string[]
}

export interface MediaUploadedMetadata {
  file_type: string
  file_size_bytes: number
  upload_method: 'direct' | 'drag_drop' | 'paste' | 'api'
  processing_time_ms?: number
  compression_applied: boolean
}

export interface TranscriptionCompletedMetadata {
  media_id: string
  media_type: 'audio' | 'video'
  duration_seconds: number
  transcription_provider: string
  word_count: number
  confidence_score?: number
  processing_time_ms: number
}

export interface PersonAddedMetadata {
  person_type: 'family_member' | 'friend' | 'other'
  has_photo: boolean
  relationship_count: number
  birth_date_provided: boolean
  added_via: 'manual' | 'photo_tag' | 'story_mention' | 'import'
}

export interface InviteSentMetadata {
  invite_method: 'email' | 'sms' | 'link' | 'qr_code'
  recipient_relationship: string
  expiry_days: number
  role_assigned: string
}

export interface InviteAcceptedMetadata {
  invite_method: 'email' | 'sms' | 'link' | 'qr_code'
  time_to_accept_hours: number
  user_was_existing: boolean
}

export interface ImportantDateAddedMetadata {
  date_type: 'birthday' | 'anniversary' | 'memorial' | 'custom'
  recurrence: 'yearly' | 'monthly' | 'none'
  privacy_level: 'private' | 'family'
  person_associated: boolean
}

// Digest and communication events
export interface DigestScheduledMetadata {
  digest_type: 'weekly' | 'monthly' | 'custom'
  recipient_count: number
  content_items: number
  scheduled_for: string
}

export interface DigestSentMetadata {
  digest_type: 'weekly' | 'monthly' | 'custom'
  recipient_count: number
  content_items: number
  delivery_method: 'email' | 'in_app'
  send_time_ms: number
}

// Moderation and safety events
export interface ContentFlaggedMetadata {
  content_type: 'story' | 'comment' | 'photo' | 'profile'
  content_id: string
  flag_type: 'inappropriate' | 'spam' | 'copyright' | 'other'
  reporter_relationship: 'family' | 'admin' | 'system'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ModActionAppliedMetadata {
  action_type: 'warn' | 'hide' | 'delete' | 'ban'
  content_type: 'story' | 'comment' | 'photo' | 'profile'
  content_id: string
  moderator_type: 'admin' | 'super_admin' | 'system'
  flag_id?: string
}

// Privacy and data rights events
export interface ExportRequestedMetadata {
  export_format: 'json' | 'pdf' | 'zip'
  data_types: string[]
  date_range_days?: number
  estimated_size_mb?: number
}

export interface ExportCompletedMetadata {
  export_format: 'json' | 'pdf' | 'zip'
  file_size_mb: number
  processing_time_minutes: number
  items_exported: {
    stories: number
    photos: number
    comments: number
    people: number
  }
  download_expires_days: number
}

export interface RtbfRequestedMetadata {
  data_types: string[]
  reason: 'user_request' | 'gdpr' | 'ccpa' | 'admin_action'
  verification_required: boolean
  estimated_items: number
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

// Onboarding - Invite Events
export interface InviteCreatedMetadata {
  invite_id: string
  invite_type: 'email' | 'code' | 'link'
  expires_at?: string
  max_uses?: number
  role: string
}

export interface InviteConsumedMetadata {
  invite_id: string
  invite_type: 'email' | 'code' | 'link'
  invited_by_id?: string
  join_method: string
}

// Onboarding - Join Events
export interface JoinStartedMetadata {
  join_method: 'invite' | 'code' | 'request'
  family_id?: string
  invite_id?: string
}

export interface JoinCompletedMetadata {
  join_method: 'invite' | 'code' | 'request'
  family_id: string
  role_assigned: string
  time_to_complete_minutes?: number
}

export interface JoinPendingMetadata {
  join_method: 'invite' | 'code' | 'request'
  family_id: string
  pending_reason: 'approval_required' | 'verification_needed' | 'admin_review'
}

// Onboarding - Code Events
export interface CodeCreatedMetadata {
  code_id: string
  code_type: 'family_join' | 'admin_invite'
  expires_at?: string
  max_uses?: number
  created_by_role: string
}

export interface CodeConsumedMetadata {
  code_id: string
  code_type: 'family_join' | 'admin_invite'
  family_id: string
  success: boolean
  failure_reason?: string
}

// Onboarding - Request Events
export interface RequestSubmittedMetadata {
  request_id: string
  family_id: string
  requested_role: string
  has_message: boolean
}

export interface RequestApprovedMetadata {
  request_id: string
  family_id: string
  approved_by_id: string
  approved_role: string
  time_to_approve_hours?: number
}

export interface RequestDeniedMetadata {
  request_id: string
  family_id: string
  denied_by_id: string
  denial_reason?: string
  time_to_deny_hours?: number
}

// Onboarding - Preflight Events
export interface PreflightNoneMetadata {
  family_name: string
  check_signals: string[]
  response_time_ms: number
}

export interface PreflightPossibleShownMetadata {
  family_name: string
  risk_level: 'possible' | 'high'
  match_signals: string[]
  user_action: 'continue' | 'abandoned' | 'switched_to_join'
}

export interface CreateAbandonedMetadata {
  family_name: string
  abandon_stage: 'preflight' | 'form' | 'submission'
  time_spent_seconds: number
  reason?: string
}

export interface CreateCompletedMetadata {
  family_id: string
  family_name: string
  status: 'active' | 'provisional'
  locale: string
  timezone: string
  preflight_risk?: 'none' | 'possible' | 'high'
  time_to_complete_minutes: number
}

export interface ProvisionalVerifiedMetadata {
  family_id: string
  verification_method: 'auto_member_join' | 'auto_timeout' | 'manual_admin'
  days_provisional: number
  final_member_count: number
}

// Admin claim events
export interface AdminClaimStartedMetadata {
  family_id: string
  claim_type: 'endorsement' | 'email_challenge'
  claimant_id: string
  reason?: string
}

export interface AdminClaimEndorsedMetadata {
  claim_id: string
  endorsement_type: 'support' | 'oppose'
  endorser_id: string
  reason?: string
}

export interface AdminClaimGrantedMetadata {
  claim_id: string
  family_id: string
  granted_to: string
  claim_type: 'endorsement' | 'email_challenge'
  cooling_off_days: number
}

export interface AdminClaimDeniedMetadata {
  claim_id: string
  family_id: string
  reason: string
  denied_by?: string
}

export const ANALYTICS_EVENTS = {
  // Core user actions
  USER_SIGNED_UP: 'user_signed_up',
  MEMORY_RECORDED: 'memory_recorded',
  MEDIA_UPLOADED: 'media_uploaded',
  TRANSCRIPTION_COMPLETED: 'transcription_completed',
  PERSON_ADDED: 'person_added',
  INVITE_SENT: 'invite_sent',
  INVITE_ACCEPTED: 'invite_accepted',
  IMPORTANT_DATE_ADDED: 'important_date_added',
  DIGEST_SCHEDULED: 'digest_scheduled',
  DIGEST_SENT: 'digest_sent',
  
  // Moderation and safety
  CONTENT_FLAGGED: 'content_flagged',
  MOD_ACTION_APPLIED: 'mod_action_applied',
  
  // Privacy and data rights
  EXPORT_REQUESTED: 'export_requested',
  EXPORT_COMPLETED: 'export_completed',
  RTBF_REQUESTED: 'rtbf_requested',
  RTBF_EXECUTED: 'rtbf_executed',
  
  // Onboarding - Invites
  INVITE_CREATED: 'invite_created',
  INVITE_CONSUMED: 'invite_consumed',
  
  // Onboarding - Join Flow
  JOIN_STARTED: 'join_started',
  JOIN_COMPLETED: 'join_completed',
  JOIN_PENDING: 'join_pending',
  
  // Onboarding - Codes
  CODE_CREATED: 'code_created',
  CODE_CONSUMED: 'code_consumed',
  
  // Onboarding - Requests
  REQUEST_SUBMITTED: 'request_submitted',
  REQUEST_APPROVED: 'request_approved',
  REQUEST_DENIED: 'request_denied',
  
  // Onboarding - Preflight & Create
  PREFLIGHT_NONE: 'preflight_none',
  PREFLIGHT_POSSIBLE_SHOWN: 'preflight_possible_shown',
  CREATE_ABANDONED: 'create_abandoned',
  CREATE_COMPLETED: 'create_completed',
  PROVISIONAL_VERIFIED: 'provisional_verified',
  
  // Admin claim events
  ADMIN_CLAIM_STARTED: 'admin_claim_started',
  ADMIN_CLAIM_ENDORSED: 'admin_claim_endorsed',
  ADMIN_CLAIM_GRANTED: 'admin_claim_granted',
  ADMIN_CLAIM_DENIED: 'admin_claim_denied',
} as const

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
  | InviteCreatedMetadata
  | InviteConsumedMetadata
  | JoinStartedMetadata
  | JoinCompletedMetadata
  | JoinPendingMetadata
  | CodeCreatedMetadata
  | CodeConsumedMetadata
  | RequestSubmittedMetadata
  | RequestApprovedMetadata
  | RequestDeniedMetadata
  | PreflightNoneMetadata
  | PreflightPossibleShownMetadata
  | CreateAbandonedMetadata
  | CreateCompletedMetadata
  | ProvisionalVerifiedMetadata
  | AdminClaimStartedMetadata
  | AdminClaimEndorsedMetadata
  | AdminClaimGrantedMetadata
  | AdminClaimDeniedMetadata

// Complete event payload
export interface AnalyticsEvent extends BaseEventData {
  event_name: string
  metadata: EventMetadata
  created_at?: string
}