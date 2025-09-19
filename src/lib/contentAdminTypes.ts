export type ContentType = 'story' | 'media' | 'answer';
export type ActionType = 'title_change' | 'date_change' | 'people_link' | 'reassign' | 'pin' | 'unpin';
export type SuggestionType = 'title' | 'date' | 'people' | 'tags';
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

export interface ContentItem {
  id: string;
  type: ContentType;
  title?: string;
  content?: string;
  created_at: string;
  updated_at?: string;
  family_id: string;
  profile_id?: string;
  // Type-specific fields
  file_name?: string; // for media
  mime_type?: string; // for media
  answer_text?: string; // for answers
  occurred_on?: string; // for answers
  people_links?: PersonLink[];
  is_pinned?: boolean;
}

export interface PersonLink {
  id: string;
  person_id: string;
  person_name: string;
}

export interface ContentAuditLog {
  id: string;
  content_type: ContentType;
  content_id: string;
  family_id: string;
  editor_id: string;
  action_type: ActionType;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  change_reason?: string;
  batch_id?: string;
  ai_suggested: boolean;
  created_at: string;
  editor_name?: string;
}

export interface ContentSuggestion {
  id: string;
  content_type: ContentType;
  content_id: string;
  family_id: string;
  suggestion_type: SuggestionType;
  suggested_value: Record<string, any>;
  confidence_score?: number;
  source_data: Record<string, any>;
  status: SuggestionStatus;
  created_by_ai?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentBatchOperation {
  id: string;
  family_id: string;
  operation_type: string;
  initiated_by: string;
  target_content_ids: string[];
  operation_data: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  completed_count: number;
  total_count: number;
  error_details: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ContentSearchFilters {
  content_type?: ContentType[];
  family_id?: string;
  search_term?: string;
  date_range?: {
    start: string;
    end: string;
  };
  has_suggestions?: boolean;
  is_pinned?: boolean;
}

export interface BulkEditRequest {
  content_ids: string[];
  operation_type: string;
  operation_data: Record<string, any>;
  change_reason?: string;
}