export type FeatureFlagStatus = 'draft' | 'active' | 'inactive' | 'archived'
export type RolloutType = 'global' | 'cohort' | 'family' | 'user'
export type TargetingType = 'role' | 'country' | 'cohort' | 'family_id' | 'user_id'

export interface FeatureFlag {
  id: string
  name: string
  key: string
  description?: string
  status: FeatureFlagStatus
  rollout_percentage: number
  rollout_type: RolloutType
  is_kill_switch: boolean
  created_by: string
  created_at: string
  updated_at: string
  last_changed_by?: string
  last_changed_at?: string
}

export interface FeatureFlagTargeting {
  id: string
  flag_id: string
  targeting_type: TargetingType
  targeting_value: string // JSON array as string
  rollout_percentage: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export interface RemoteConfig {
  id: string
  key: string
  name: string
  description?: string
  value_type: 'string' | 'number' | 'boolean' | 'json'
  default_value: any
  current_value: any
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  last_changed_by?: string
  last_changed_at?: string
}

export interface FeatureFlagUserOverride {
  id: string
  flag_id: string
  user_id: string
  is_enabled: boolean
  reason?: string
  created_by: string
  created_at: string
  expires_at?: string
}

export interface FeatureFlagAnalytics {
  id: string
  flag_id: string
  user_id?: string
  family_id?: string
  event_type: 'evaluated' | 'enabled' | 'disabled'
  evaluation_result?: boolean
  targeting_reason?: string
  created_at: string
}

export interface FeatureFlagEvaluation {
  enabled: boolean
  reason: string
  flag_id?: string
}

export interface UserContext {
  user_id?: string
  family_id?: string
  user_role?: string
  user_country?: string
  user_cohort?: string
}

export interface FeatureFlagCache {
  flags: Record<string, FeatureFlagEvaluation>
  config: Record<string, any>
  lastFetched: number
  ttl: number
}

export interface CreateFeatureFlagRequest {
  name: string
  key: string
  description?: string
  rollout_percentage?: number
  rollout_type?: RolloutType
  is_kill_switch?: boolean
}

export interface UpdateFeatureFlagRequest {
  name?: string
  description?: string
  status?: FeatureFlagStatus
  rollout_percentage?: number
  rollout_type?: RolloutType
  is_kill_switch?: boolean
}

export interface CreateTargetingRuleRequest {
  flag_id: string
  targeting_type: TargetingType
  targeting_value: string[]
  rollout_percentage?: number
}

export interface UpdateRemoteConfigRequest {
  current_value: any
}

// Default config values that can be overridden remotely
export const DEFAULT_REMOTE_CONFIG = {
  prompt_rotation_interval_hours: 24,
  max_upload_size_mb: 50,
  autosave_interval_seconds: 30,
  digest_unlock_threshold: 2,
  max_family_members: 50,
  enable_voice_transcription: true
} as const

export type RemoteConfigKey = keyof typeof DEFAULT_REMOTE_CONFIG