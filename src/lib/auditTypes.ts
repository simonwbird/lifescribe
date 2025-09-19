export type AuditActionType = 
  | 'LOGIN' | 'LOGOUT' | 'SIGNUP' | 'PASSWORD_CHANGE' | 'EMAIL_CHANGE'
  | 'STORY_CREATE' | 'STORY_UPDATE' | 'STORY_DELETE' | 'STORY_VIEW'
  | 'COMMENT_CREATE' | 'COMMENT_UPDATE' | 'COMMENT_DELETE'
  | 'REACTION_CREATE' | 'REACTION_DELETE'
  | 'MEDIA_UPLOAD' | 'MEDIA_DELETE' | 'MEDIA_VIEW'
  | 'FAMILY_CREATE' | 'FAMILY_UPDATE' | 'FAMILY_DELETE'
  | 'MEMBER_INVITE' | 'MEMBER_JOIN' | 'MEMBER_REMOVE' | 'MEMBER_ROLE_CHANGE'
  | 'ADMIN_ACCESS_GRANTED' | 'ADMIN_ACCESS_REVOKED' | 'ADMIN_LOGIN'
  | 'EXPORT_REQUESTED' | 'EXPORT_COMPLETED' | 'RTBF_REQUESTED' | 'RTBF_EXECUTED'
  | 'SETTINGS_UPDATE' | 'PRIVACY_CHANGE' | 'PROFILE_UPDATE'
  | 'RECIPE_CREATE' | 'RECIPE_UPDATE' | 'RECIPE_DELETE'
  | 'PROPERTY_CREATE' | 'PROPERTY_UPDATE' | 'PROPERTY_DELETE'
  | 'PET_CREATE' | 'PET_UPDATE' | 'PET_DELETE'

export interface AuditLogEntry {
  id: string
  sequence_number: number
  actor_id: string | null
  actor_type: 'user' | 'system' | 'admin'
  action: AuditActionType
  entity_type: string
  entity_id: string | null
  family_id: string | null
  ip_address: string | null
  user_agent: string | null
  session_id: string | null
  details: Record<string, any>
  before_values: Record<string, any>
  after_values: Record<string, any>
  risk_score: number
  created_at: string
  previous_hash: string | null
  current_hash: string
  hash_algorithm: string
  is_tampered: boolean
  verified_at: string | null
  
  // Joined data
  actor_profile?: {
    full_name: string | null
    email: string
  }
  family?: {
    name: string
  }
}

export interface AdminAccessLog {
  id: string
  admin_id: string
  family_id: string | null
  role: string
  granted_by: string | null
  granted_at: string
  last_activity_at: string
  revoked_at: string | null
  revoked_by: string | null
  revoke_reason: string | null
  is_active: boolean
  
  // Joined data
  admin_profile?: {
    full_name: string | null
    email: string
  }
  granted_by_profile?: {
    full_name: string | null
    email: string
  }
  revoked_by_profile?: {
    full_name: string | null
    email: string
  }
  family?: {
    name: string
  }
}

export interface AuditFilters {
  actor_id?: string
  action?: AuditActionType
  entity_type?: string
  family_id?: string
  date_from?: string
  date_to?: string
  risk_score_min?: number
  risk_score_max?: number
  is_tampered?: boolean
  search?: string
}

export interface AuditIntegrityResult {
  valid: boolean
  errors: Array<{
    sequence: number
    expected_hash: string
    actual_hash: string
    message: string
  }>
  summary: {
    checked_records: number
    error_count: number
    verified_at: string
  }
}

export interface QuarterlyAccessReview {
  review_id: string
  generated_at: string
  period_start: string
  period_end: string
  total_admins: number
  active_admins: number
  inactive_admins: number
  high_risk_accounts: number
  
  admin_summary: Array<{
    admin_id: string
    email: string
    full_name: string | null
    total_families: number
    last_activity_at: string | null
    days_since_activity: number | null
    risk_score: number
    access_entries: Array<{
      family_id: string
      family_name: string
      role: string
      granted_at: string
      last_activity_at: string
      is_active: boolean
    }>
    recommendations: string[]
  }>
}

export interface AuditEventPayload {
  actor_id?: string
  actor_type?: 'user' | 'system' | 'admin'
  action: AuditActionType
  entity_type: string
  entity_id?: string
  family_id?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  details?: Record<string, any>
  before_values?: Record<string, any>
  after_values?: Record<string, any>
  risk_score?: number
}

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  LOGIN: 'User Login',
  LOGOUT: 'User Logout', 
  SIGNUP: 'User Signup',
  PASSWORD_CHANGE: 'Password Change',
  EMAIL_CHANGE: 'Email Change',
  STORY_CREATE: 'Story Created',
  STORY_UPDATE: 'Story Updated',
  STORY_DELETE: 'Story Deleted',
  STORY_VIEW: 'Story Viewed',
  COMMENT_CREATE: 'Comment Created',
  COMMENT_UPDATE: 'Comment Updated',
  COMMENT_DELETE: 'Comment Deleted',
  REACTION_CREATE: 'Reaction Added',
  REACTION_DELETE: 'Reaction Removed',
  MEDIA_UPLOAD: 'Media Uploaded',
  MEDIA_DELETE: 'Media Deleted',
  MEDIA_VIEW: 'Media Viewed',
  FAMILY_CREATE: 'Family Created',
  FAMILY_UPDATE: 'Family Updated',
  FAMILY_DELETE: 'Family Deleted',
  MEMBER_INVITE: 'Member Invited',
  MEMBER_JOIN: 'Member Joined',
  MEMBER_REMOVE: 'Member Removed',
  MEMBER_ROLE_CHANGE: 'Member Role Changed',
  ADMIN_ACCESS_GRANTED: 'Admin Access Granted',
  ADMIN_ACCESS_REVOKED: 'Admin Access Revoked',
  ADMIN_LOGIN: 'Admin Login',
  EXPORT_REQUESTED: 'Data Export Requested',
  EXPORT_COMPLETED: 'Data Export Completed',
  RTBF_REQUESTED: 'RTBF Requested',
  RTBF_EXECUTED: 'RTBF Executed',
  SETTINGS_UPDATE: 'Settings Updated',
  PRIVACY_CHANGE: 'Privacy Changed',
  PROFILE_UPDATE: 'Profile Updated',
  RECIPE_CREATE: 'Recipe Created',
  RECIPE_UPDATE: 'Recipe Updated',
  RECIPE_DELETE: 'Recipe Deleted',
  PROPERTY_CREATE: 'Property Created',
  PROPERTY_UPDATE: 'Property Updated',
  PROPERTY_DELETE: 'Property Deleted',
  PET_CREATE: 'Pet Created',
  PET_UPDATE: 'Pet Updated',
  PET_DELETE: 'Pet Deleted',
}

export const RISK_SCORE_LEVELS = {
  LOW: { min: 0, max: 25, label: 'Low', color: 'green' },
  MEDIUM: { min: 26, max: 50, label: 'Medium', color: 'yellow' },
  HIGH: { min: 51, max: 75, label: 'High', color: 'orange' },
  CRITICAL: { min: 76, max: 100, label: 'Critical', color: 'red' },
} as const

export function getRiskLevel(score: number) {
  for (const [key, level] of Object.entries(RISK_SCORE_LEVELS)) {
    if (score >= level.min && score <= level.max) {
      return { key, ...level }
    }
  }
  return { key: 'LOW', ...RISK_SCORE_LEVELS.LOW }
}