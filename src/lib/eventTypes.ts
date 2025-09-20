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
  
  // Onboarding - Invites
  INVITE_CREATED: 'INVITE_CREATED',
  INVITE_CONSUMED: 'INVITE_CONSUMED',
  
  // Onboarding - Join Flow
  JOIN_STARTED: 'JOIN_STARTED',
  JOIN_COMPLETED: 'JOIN_COMPLETED',
  JOIN_PENDING: 'JOIN_PENDING',
  
  // Onboarding - Codes
  CODE_CREATED: 'CODE_CREATED',
  CODE_CONSUMED: 'CODE_CONSUMED',
  
  // Onboarding - Access Requests
  REQUEST_SUBMITTED: 'REQUEST_SUBMITTED',
  REQUEST_APPROVED: 'REQUEST_APPROVED',
  REQUEST_DENIED: 'REQUEST_DENIED',
  
  // Onboarding - Preflight Checks
  PREFLIGHT_STARTED: 'PREFLIGHT_STARTED',
  PREFLIGHT_COMPLETED: 'PREFLIGHT_COMPLETED',
  PREFLIGHT_FAILED: 'PREFLIGHT_FAILED',
  
  // Onboarding - Merge Proposals
  MERGE_PROPOSED: 'MERGE_PROPOSED',
  MERGE_APPROVED: 'MERGE_APPROVED',
  MERGE_DENIED: 'MERGE_DENIED',
  MERGE_COMPLETED: 'MERGE_COMPLETED',
  
  // Onboarding - Admin Claims
  CLAIM_ADMIN_STARTED: 'CLAIM_ADMIN_STARTED',
  CLAIM_ADMIN_COMPLETED: 'CLAIM_ADMIN_COMPLETED',
  CLAIM_ADMIN_FAILED: 'CLAIM_ADMIN_FAILED',
  
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
export interface PreflightStartedMetadata {
  check_type: 'family_validation' | 'user_eligibility' | 'role_availability'
  family_id?: string
  context: string
}

export interface PreflightCompletedMetadata {
  check_type: 'family_validation' | 'user_eligibility' | 'role_availability'
  family_id?: string
  checks_passed: string[]
  warnings: string[]
  processing_time_ms?: number
}

export interface PreflightFailedMetadata {
  check_type: 'family_validation' | 'user_eligibility' | 'role_availability'
  family_id?: string
  failure_reason: string
  failed_checks: string[]
}

// Onboarding - Merge Events
export interface MergeProposedMetadata {
  proposal_id: string
  source_family_id: string
  target_family_id: string
  proposal_type: 'merge' | 'absorb' | 'split'
  has_message: boolean
}

export interface MergeApprovedMetadata {
  proposal_id: string
  source_family_id: string
  target_family_id: string
  approved_by_id: string
  time_to_approve_hours?: number
}

export interface MergeDeniedMetadata {
  proposal_id: string
  source_family_id: string
  target_family_id: string
  denied_by_id: string
  denial_reason?: string
}

export interface MergeCompletedMetadata {
  proposal_id: string
  source_family_id: string
  target_family_id: string
  members_transferred: number
  content_transferred: number
  processing_time_minutes?: number
}

// Onboarding - Admin Claim Events
export interface ClaimAdminStartedMetadata {
  family_id: string
  claim_method: 'verification' | 'approval' | 'override'
  current_admin_count: number
}

export interface ClaimAdminCompletedMetadata {
  family_id: string
  claim_method: 'verification' | 'approval' | 'override'
  approved_by_id?: string
  time_to_complete_minutes?: number
}

export interface ClaimAdminFailedMetadata {
  family_id: string
  claim_method: 'verification' | 'approval' | 'override'
  failure_reason: string
  verification_attempts?: number
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
  | PreflightStartedMetadata
  | PreflightCompletedMetadata
  | PreflightFailedMetadata
  | MergeProposedMetadata
  | MergeApprovedMetadata
  | MergeDeniedMetadata
  | MergeCompletedMetadata
  | ClaimAdminStartedMetadata
  | ClaimAdminCompletedMetadata
  | ClaimAdminFailedMetadata
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