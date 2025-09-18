// Admin role types
export type AdminRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'FAMILY_ADMIN'

// Admin navigation items
export interface AdminNavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: AdminRole[]
}

// Search result types
export interface AdminSearchResult {
  id: string
  type: 'person' | 'family' | 'life_page' | 'email' | 'invite'
  title: string
  subtitle: string
  metadata: Record<string, any>
  href: string
}

// Saved view types
export interface SavedView {
  id: string
  name: string
  description?: string
  filters: Record<string, any>
  route: string
  created_at: string
  created_by: string
}

// Admin analytics events
export type AdminAnalyticsEvent = 
  | 'ADMIN_SEARCH'
  | 'ADMIN_SAVED_VIEW_CREATED'
  | 'ADMIN_SAVED_VIEW_LOADED'
  | 'ADMIN_ROUTE_ACCESSED'