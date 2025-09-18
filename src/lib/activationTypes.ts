// Activation dashboard types
export interface ActivationKPIs {
  medianTTV: {
    hours: number
    change: number // percentage change from previous period
  }
  day3Activation: {
    percentage: number
    change: number
    total: number
    completed: number
  }
  day7DigestEnabled: {
    percentage: number
    change: number
    total: number
    enabled: number
  }
}

export interface FunnelStage {
  id: string
  name: string
  count: number
  percentage: number
  stuckFamilies: FamilyStuckData[]
}

export interface FamilyStuckData {
  id: string
  name: string
  createdAt: string
  daysSinceSignup: number
  email: string
  lastActivity?: string
  missingSteps: string[]
}

export interface ActivationFunnel {
  totalSignups: number
  stages: FunnelStage[]
}

export interface CohortData {
  period: string // e.g., "2024-W01", "2024-01-15"
  signups: number
  medianTTV: number
  day3Activation: number
  day7Digest: number
}

export interface ActivationFilters {
  timeRange: '7d' | '30d' | '90d'
  cohortBy: 'week' | 'country' | 'referrer'
  country?: string
  referrer?: string
}

// Analytics events for activation tracking
export interface ActivationEvent {
  userId: string
  familyId: string
  eventType: 'USER_SIGNED_UP' | 'MEMORY_RECORDED' | 'INVITE_SENT' | 'INVITE_ACCEPTED' | 'DIGEST_SENT' | 'IMPORTANT_DATE_ADDED'
  timestamp: string
  metadata?: Record<string, any>
}

// Admin activation analytics events
export type ActivationAnalyticsEvent = 
  | 'ADMIN_ACTIVATION_DASHBOARD_LOADED'
  | 'ADMIN_FUNNEL_STAGE_CLICKED'
  | 'ADMIN_NUDGE_SENT'
  | 'ADMIN_COHORT_FILTER_APPLIED'