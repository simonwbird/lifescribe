export type NudgeTriggerType = 
  | 'no_memory_24h'
  | 'no_memory_7d'
  | 'no_invite_sent'
  | 'no_digest_enabled'
  | 'inactive_7d'
  | 'inactive_30d'
  | 'first_login'
  | 'memory_milestone';

export type NudgeChannelType = 'email' | 'sms' | 'in_app' | 'push';

export type NudgeStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface NudgeTemplate {
  id: string;
  name: string;
  channel: NudgeChannelType;
  subject?: string;
  content: string;
  variables: string[];
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Nudge {
  id: string;
  name: string;
  description?: string;
  trigger_type: NudgeTriggerType;
  trigger_config: Record<string, any>;
  channel: NudgeChannelType;
  template_id?: string;
  audience_rules: Record<string, any>;
  throttle_config: {
    max_per_day: number;
    min_interval_hours: number;
  };
  status: NudgeStatus;
  
  // A/B testing
  is_ab_test: boolean;
  holdout_percentage: number;
  variant_a_percentage: number;
  variant_b_template_id?: string;
  
  // Conversion tracking
  conversion_window_hours: number;
  conversion_events: string[];
  
  created_by: string;
  family_id?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  ended_at?: string;
  
  // Joined data
  template?: NudgeTemplate;
  variant_b_template?: NudgeTemplate;
}

export interface NudgeSend {
  id: string;
  nudge_id: string;
  user_id: string;
  family_id?: string;
  variant: 'control' | 'a' | 'b';
  template_id?: string;
  channel: NudgeChannelType;
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  trigger_data: Record<string, any>;
  send_metadata: Record<string, any>;
}

export interface NudgeConversion {
  id: string;
  nudge_send_id: string;
  user_id: string;
  family_id?: string;
  conversion_event: string;
  converted_at: string;
  hours_to_convert?: number;
  conversion_data: Record<string, any>;
}

export interface AudienceEstimate {
  total_users: number;
  eligible_users: number;
  holdout_users: number;
  variant_a_users: number;
  variant_b_users: number;
}

export interface NudgeAnalytics {
  total_sends: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  conversions_by_variant: {
    control: number;
    a: number;
    b: number;
  };
  avg_hours_to_convert: number;
}

export const NUDGE_TRIGGER_LABELS: Record<NudgeTriggerType, string> = {
  'no_memory_24h': 'No memory within 24 hours',
  'no_memory_7d': 'No memory within 7 days',
  'no_invite_sent': 'No invite sent',
  'no_digest_enabled': 'Weekly digest not enabled',
  'inactive_7d': 'Inactive for 7 days',
  'inactive_30d': 'Inactive for 30 days',
  'first_login': 'First login',
  'memory_milestone': 'Memory milestone reached'
};

export const NUDGE_CHANNEL_LABELS: Record<NudgeChannelType, string> = {
  'email': 'Email',
  'sms': 'SMS',
  'in_app': 'In-App Notification',
  'push': 'Push Notification'
};

export const CONVERSION_EVENT_LABELS: Record<string, string> = {
  'MEMORY_RECORDED': 'Memory Recorded',
  'INVITE_SENT': 'Invite Sent',
  'DIGEST_ENABLED': 'Weekly Digest Enabled',
  'STORY_SHARED': 'Story Shared',
  'PROFILE_COMPLETED': 'Profile Completed',
  'FIRST_UPLOAD': 'First Upload'
};