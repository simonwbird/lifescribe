// Impersonation types
export interface ImpersonationTarget {
  id: string
  name: string
  email: string
  type: 'user' | 'family'
  primaryFamilyId?: string // For users, their primary family
}

export interface ImpersonationState {
  isImpersonating: boolean
  target: ImpersonationTarget | null
  startedAt: string | null
  timeoutId: NodeJS.Timeout | null
}

// Impersonation analytics events
export type ImpersonationAnalyticsEvent = 
  | 'ADMIN_IMPERSONATE_STARTED'
  | 'ADMIN_IMPERSONATE_ENDED'
  | 'ADMIN_IMPERSONATE_TIMEOUT'
  | 'ADMIN_IMPERSONATE_BLOCKED_WRITE'

// Impersonation session duration (30 minutes)
export const IMPERSONATION_TIMEOUT_MS = 30 * 60 * 1000