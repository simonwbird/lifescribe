import { supabase } from '@/integrations/supabase/client'
import { User } from '@supabase/supabase-js'
import { mapAuthError, MappedAuthError } from './errors'
import { makeCancellable } from './network'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  simple_mode: boolean
  locale: string
  timezone: string
  country: string | null
  settings: Record<string, any>
  created_at: string
  default_space_id: string | null
}

export interface UserRole {
  family_id: string
  role: 'admin' | 'member' | 'guest'
  family_name: string
}

export interface OnboardingState {
  hasProfile: boolean
  hasDefaultFamily: boolean
  needsModeSelection: boolean
  isComplete: boolean
}

export interface AuthResponse<T = any> {
  data: T | null
  error: MappedAuthError | null
}

/**
 * Get user profile from profiles table
 */
export async function getProfile(
  userId: string,
  signal?: AbortSignal
): Promise<AuthResponse<UserProfile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return {
        data: null,
        error: mapAuthError(error)
      }
    }

    return {
      data: data as UserProfile,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Get user roles from members table
 */
export async function getRolesFromMembers(
  userId: string,
  signal?: AbortSignal
): Promise<AuthResponse<UserRole[]>> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select(`
        family_id,
        role,
        families!inner(name)
      `)
      .eq('profile_id', userId)

    if (error) {
      return {
        data: null,
        error: mapAuthError(error)
      }
    }

    const roles: UserRole[] = data.map(member => ({
      family_id: member.family_id,
      role: member.role as 'admin' | 'member' | 'guest',
      family_name: (member.families as any)?.name || 'Unknown Family'
    }))

    return {
      data: roles,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>,
  signal?: AbortSignal
): Promise<AuthResponse<UserProfile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: mapAuthError(error)
      }
    }

    return {
      data: data as UserProfile,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Get onboarding state for user
 */
export async function getOnboardingState(
  userId: string,
  signal?: AbortSignal
): Promise<AuthResponse<OnboardingState>> {
  try {
    // Get profile and check for default family
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, default_space_id, simple_mode')
      .eq('id', userId)
      .single()

    if (profileError) {
      return {
        data: null,
        error: mapAuthError(profileError)
      }
    }

    // Check if user has any family memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('members')
      .select('family_id')
      .eq('profile_id', userId)
      .limit(1)

    if (membershipError) {
      return {
        data: null,
        error: mapAuthError(membershipError)
      }
    }

    const hasProfile = !!(profile && profile.full_name)
    const hasDefaultFamily = !!(profile?.default_space_id && memberships?.length > 0)
    const needsModeSelection = false // Simple mode is now default, no selection needed
    const isComplete = hasProfile && hasDefaultFamily && !needsModeSelection

    return {
      data: {
        hasProfile,
        hasDefaultFamily,
        needsModeSelection,
        isComplete
      },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Check if user is super admin using secure server-side function
 */
export async function isSuperAdmin(
  userId: string,
  signal?: AbortSignal
): Promise<AuthResponse<boolean>> {
  try {
    const { data, error } = await supabase.rpc('is_super_admin', {
      _user_id: userId
    })

    if (error) {
      return {
        data: false,
        error: mapAuthError(error)
      }
    }

    return {
      data: data || false,
      error: null
    }
  } catch (error) {
    return {
      data: false,
      error: mapAuthError(error)
    }
  }
}

/**
 * Get user's family IDs
 */
export async function getUserFamilyIds(
  userId: string,
  signal?: AbortSignal
): Promise<AuthResponse<string[]>> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('family_id')
      .eq('profile_id', userId)

    if (error) {
      return {
        data: null,
        error: mapAuthError(error)
      }
    }

    return {
      data: data.map(member => member.family_id),
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}