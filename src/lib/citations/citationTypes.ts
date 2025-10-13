export type SourceType = 'file' | 'link' | 'note';

export interface StorySource {
  id: string;
  story_id: string;
  family_id: string;
  source_type: SourceType;
  source_content: string;
  paragraph_index: number | null;
  display_text: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSourceInput {
  story_id: string;
  family_id: string;
  source_type: SourceType;
  source_content: string;
  paragraph_index?: number | null;
  display_text?: string | null;
}
