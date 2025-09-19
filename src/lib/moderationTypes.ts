export type ModerationSource = 'user_flag' | 'automated_nsfw' | 'automated_toxicity' | 'automated_pii' | 'dmca';
export type ModerationActionType = 'hide' | 'blur' | 'age_gate' | 'notify_owner' | 'escalate' | 'resolve';
export type ModerationItemType = 'story' | 'media' | 'answer' | 'comment';
export type ModerationStatus = 'pending' | 'in_review' | 'resolved' | 'escalated';

export interface ModerationFlag {
  id: string;
  family_id: string;
  item_type: ModerationItemType;
  item_id: string;
  source: ModerationSource;
  reason: string;
  details: Record<string, any>;
  flagged_by?: string;
  created_at: string;
  severity: number;
}

export interface ModerationAction {
  id: string;
  flag_id: string;
  action_type: ModerationActionType;
  actor_id: string;
  rationale: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ModerationQueueItem {
  id: string;
  flag_id: string;
  family_id: string;
  item_type: ModerationItemType;
  item_id: string;
  status: ModerationStatus;
  assigned_to?: string;
  sla_due_at?: string;
  priority: number;
  created_at: string;
  updated_at: string;
  // Joined data
  flag?: ModerationFlag;
  actions?: ModerationAction[];
  item_data?: any;
}

export interface BulkModerationRequest {
  item_ids: string[];
  action_type: ModerationActionType;
  rationale: string;
}

export interface ModerationFilters {
  status?: ModerationStatus[];
  source?: ModerationSource[];
  item_type?: ModerationItemType[];
  priority?: number[];
  assigned_to?: string;
  overdue_only?: boolean;
}