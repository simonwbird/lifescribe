import { useAuth } from '@/contexts/AuthProvider'
import { Session } from '@supabase/supabase-js'

/**
 * Hook for stable session access
 * Returns the current session and a boolean indicating if it's loading
 */
export function useSession(): {
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
} {
  const { session, loading, isAuthenticated } = useAuth()
  
  return {
    session,
    loading,
    isAuthenticated
  }
}