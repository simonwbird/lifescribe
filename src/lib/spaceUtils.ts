import { supabase } from '@/lib/supabase'

/**
 * Utility functions for handling space-scoped operations
 */

/**
 * Get the current user's active space ID
 * In MVP mode, this is always the default_space_id
 * In Labs mode with multiSpaces enabled, this could be a different active space
 */
export async function getCurrentSpaceId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get user's profile with default space
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_space_id, settings')
      .eq('id', user.id)
      .single()

    if (!profile?.default_space_id) return null

    // For now, always return default_space_id
    // In a full multi-space implementation, this would check for active space in global state
    return profile.default_space_id
  } catch (error) {
    console.error('Error getting current space ID:', error)
    return null
  }
}

/**
 * Ensure all database operations include the correct family_id/space_id
 * This is a helper to be used in components that create or update space-scoped data
 */
export async function withSpaceId<T extends Record<string, any>>(
  data: T
): Promise<T & { family_id: string }> {
  const spaceId = await getCurrentSpaceId()
  if (!spaceId) {
    throw new Error('No active space found. User may need to be onboarded.')
  }
  
  return {
    ...data,
    family_id: spaceId
  }
}