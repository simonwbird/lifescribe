// Admin family overview types
export interface FamilyOverviewData {
  id: string
  name: string
  created_at: string
  
  // Member metrics
  total_members: number
  living_members: number
  deceased_members: number
  
  // Activity metrics
  contributors_30d: number
  memories_count: number
  last_activity: string | null
  
  // Engagement metrics
  digest_enabled: boolean
  digest_frequency: string | null
  
  // Invite metrics
  invites_sent: number
  invites_accepted: number
  
  // Storage metrics
  storage_used_mb: number
  storage_limit_mb: number
  
  // Health flags
  flags_count: number
  health_status: 'healthy' | 'attention' | 'problem'
  
  // Additional metadata
  creator: {
    id: string
    name: string
    email: string
  }
}

export interface FamilyOverviewFilters {
  search: string
  health_status: 'all' | 'healthy' | 'attention' | 'problem'
  no_first_memory_24h: boolean
  no_invites_sent: boolean
  digest_disabled: boolean
  storage_over_80: boolean
  has_flags: boolean
}

export interface FamilyRowAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: (family: FamilyOverviewData) => void
  variant?: 'default' | 'secondary' | 'destructive'
}

// Admin family analytics events
export type AdminFamilyAnalyticsEvent = 
  | 'ADMIN_FAMILY_FILTER_APPLIED'
  | 'ADMIN_ROW_ACTION_CLICKED'
  | 'ADMIN_FAMILY_VIEW_LOADED'
  | 'ADMIN_FAMILY_EXPORT_STARTED'