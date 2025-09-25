/**
 * Phase 6: Secure role management hooks
 * Ensures all role checks come from database, not client storage
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'

export interface UserRole {
  systemRole: 'super_admin' | 'member' | null
  familyRoles: Array<{
    familyId: string
    role: 'admin' | 'member'
    familyName: string
  }>
  isBootstrapAdmin: boolean
}

/**
 * Securely fetch user roles from database
 * Never trusts client-side storage or session claims
 */
export function useSecureRoles() {
  const { user, session } = useAuth()

  return useQuery({
    queryKey: ['secure-roles', user?.id],
    queryFn: async (): Promise<UserRole> => {
      if (!user?.id || !session) {
        return {
          systemRole: null,
          familyRoles: [],
          isBootstrapAdmin: false
        }
      }

      try {
        // Get user profile for system role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('settings')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
        }

        // Get family roles from members table
        const { data: familyRolesData, error: familyError } = await supabase
          .from('members')
          .select(`
            family_id,
            role,
            families:family_id (
              name
            )
          `)
          .eq('profile_id', user.id)

        if (familyError) {
          console.error('Error fetching family roles:', familyError)
        }

        // Parse settings safely
        const settings = profileData?.settings as any || {}
        const systemRole = settings?.role === 'super_admin' ? 'super_admin' : 'member'
        const isBootstrapAdmin = settings?.bootstrap_admin === true

        return {
          systemRole,
          familyRoles: (familyRolesData || []).map((member: any) => ({
            familyId: member.family_id,
            role: member.role,
            familyName: member.families?.name || 'Unknown Family'
          })),
          isBootstrapAdmin
        }
      } catch (error) {
        console.error('Error in useSecureRoles:', error)
        return {
          systemRole: null,
          familyRoles: [],
          isBootstrapAdmin: false
        }
      }
    },
    enabled: !!user?.id && !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true
  })
}

/**
 * Check if user is super admin (system-wide)
 */
export function useIsSuperAdmin() {
  const { data: roles } = useSecureRoles()
  return roles?.systemRole === 'super_admin' || false
}

/**
 * Check if user is admin of a specific family
 */
export function useIsFamilyAdmin(familyId?: string) {
  const { data: roles } = useSecureRoles()
  
  if (!familyId || !roles?.familyRoles) return false
  
  return roles.familyRoles.some(
    role => role.familyId === familyId && role.role === 'admin'
  )
}

/**
 * Get all families where user is admin
 */
export function useAdminFamilies() {
  const { data: roles } = useSecureRoles()
  
  return roles?.familyRoles.filter(role => role.role === 'admin') || []
}

/**
 * Hook to invalidate role cache when needed
 */
export function useInvalidateRoles() {
  const { user } = useAuth()
  
  return () => {
    if (user?.id) {
      // Invalidate the query cache
      import('@tanstack/react-query').then(({ useQueryClient }) => {
        const queryClient = useQueryClient()
        queryClient.invalidateQueries({ queryKey: ['secure-roles', user.id] })
      })
    }
  }
}