// Analytics event types and interfaces
export interface BaseAnalyticsEvent {
  event_name: string
  user_id?: string
  family_id?: string
  properties?: Record<string, any>
  timestamp?: string
}

// Core funnel events
export interface PromptViewEvent extends BaseAnalyticsEvent {
  event_name: 'prompt_view'
  properties: {
    prompt_id: string
    prompt_type: 'general' | 'person_specific' | 'birthday' | 'elder'
    position: number
    source: 'home' | 'prompts_page' | 'shuffle' | 'onboarding'
    session_id: string
  }
}

export interface PromptShuffleEvent extends BaseAnalyticsEvent {
  event_name: 'prompt_shuffle'
  properties: {
    previous_prompts: string[]
    new_prompts: string[]
    shuffle_count: number
    session_id: string
  }
}

export interface StoryStartEvent extends BaseAnalyticsEvent {
  event_name: 'story_start'
  properties: {
    prompt_id?: string
    story_type: 'voice' | 'text' | 'photo' | 'video'
    source: 'prompt' | 'create_menu' | 'quick_capture'
    session_id: string
  }
}

export interface StorySaveEvent extends BaseAnalyticsEvent {
  event_name: 'story_save'
  properties: {
    story_id: string
    story_type: 'voice' | 'text' | 'photo' | 'video'
    prompt_id?: string
    content_length: number
    time_to_complete: number
    session_id: string
  }
}

export interface StreakContinueEvent extends BaseAnalyticsEvent {
  event_name: 'streak_continue'
  properties: {
    streak_count: number
    days_since_last_story: number
    milestone_reached?: boolean
    session_id: string
  }
}

export interface InviteSendEvent extends BaseAnalyticsEvent {
  event_name: 'invite_send'
  properties: {
    invite_method: 'email' | 'sms' | 'link'
    recipient_count: number
    source: 'onboarding' | 'settings' | 'home_banner' | 'menu'
    session_id: string
  }
}

export interface InviteAcceptEvent extends BaseAnalyticsEvent {
  event_name: 'invite_accept'
  properties: {
    invite_token: string
    invite_age_hours: number
    signup_method: 'email' | 'google' | 'existing_user'
    session_id: string
  }
}

export interface DigestEvent extends BaseAnalyticsEvent {
  event_name: 'digest_toggled' | 'digest_paused' | 'digest_resumed' | 'digest_sent' | 'digest_pause_failed' | 'digest_follow_toggled' | 'digest_follow_all'
  properties: {
    enabled?: boolean
    family_id?: string
    duration_days?: number
    recipient_count?: number
    error?: string
    member_id?: string
    followed?: boolean
  }
}

// Union type for all events
export type AnalyticsEvent = 
  | PromptViewEvent
  | PromptShuffleEvent
  | StoryStartEvent
  | StorySaveEvent
  | StreakContinueEvent
  | InviteSendEvent
  | InviteAcceptEvent
  | DigestEvent

// Funnel metrics
export interface FunnelMetrics {
  first_story_funnel: {
    prompt_views: number
    story_starts: number
    story_saves: number
    conversion_rate: number
  }
  weekly_active_storytellers: {
    total_users: number
    active_users: number
    stories_created: number
    avg_stories_per_user: number
  }
  streaks: {
    active_streaks: number
    avg_streak_length: number
    longest_streak: number
    streak_milestones: Record<number, number>
  }
}

// A/B Test framework types
export interface ABTest {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  traffic_allocation: number
  variants: ABVariant[]
  targeting?: ABTargeting
  metrics: string[]
  start_date?: string
  end_date?: string
}

export interface ABVariant {
  id: string
  name: string
  allocation: number
  config: Record<string, any>
}

export interface ABTargeting {
  user_roles?: string[]
  family_ids?: string[]
  countries?: string[]
  user_cohorts?: string[]
}

export interface ABAssignment {
  test_id: string
  variant_id: string
  user_id: string
  assigned_at: string
}