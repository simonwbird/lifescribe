export interface ExportAnalysis {
  export_id: string
  status: 'processing' | 'ready' | 'expired' | 'failed'
  estimated_size_mb: number
  media_count: number
  expires_at: string
  download_url?: string
  zip_contents?: Record<string, string>
}

export interface RTBFAnalysis {
  analysis_id: string
  user_id: string
  analyzed_at: string
  deletion_analysis: {
    user_data: {
      profile: number
      family_memberships: number
      affected_families: string[]
    }
    content_data: {
      stories: number
      answers: number
      comments: number
      reactions: number
      media_files: number
      recipes: number
      properties: number
      pets: number
      face_tags: number
      guestbook_entries: number
    }
    impact_analysis: {
      total_items: number
      affected_families: number
      orphaned_content: Array<{
        type: string
        items: Array<{
          id: string
          title: string
          comment_count?: number
        }>
      }>
      shared_content_warnings: string[]
    }
  }
  warnings: string[]
  next_steps: string[]
}

export interface RTBFDeletionLog {
  step: string
  status: 'started' | 'completed' | 'failed'
  count?: number
  error?: string
  timestamp: string
}

export interface RTBFCompletionReceipt {
  deletion_id: string
  user_id: string
  completed_at: string
  total_items_deleted: number
  deletion_log: RTBFDeletionLog[]
  status: 'completed' | 'failed'
}