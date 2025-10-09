import { supabase } from '@/integrations/supabase/client'

export type EventRole = 'contributor' | 'viewer' | 'guest'

export interface EventAcl {
  id: string
  event_id: string
  user_id: string | null
  guest_session_id: string | null
  role: EventRole
  family_id: string
  granted_by: string
  created_at: string
  updated_at: string
}

export interface EventPermissions {
  canContribute: boolean
  canComment: boolean
  canUpload: boolean
  canView: boolean
  role: EventRole | null
  needsApproval: boolean
}

/**
 * Check user's permissions for a specific event
 */
export async function checkEventPermissions(
  eventId: string,
  userId?: string,
  guestSessionId?: string
): Promise<EventPermissions> {
  try {
    // Get ACL entry for this user/guest
    const query = supabase
      .from('event_acl')
      .select('role')
      .eq('event_id', eventId)

    if (userId) {
      query.eq('user_id', userId)
    } else if (guestSessionId) {
      query.eq('guest_session_id', guestSessionId)
    } else {
      // No user or guest - no permissions
      return {
        canContribute: false,
        canComment: false,
        canUpload: false,
        canView: false,
        role: null,
        needsApproval: true
      }
    }

    const { data, error } = await query.single()

    if (error || !data) {
      // No ACL entry - default to no permissions
      return {
        canContribute: false,
        canComment: false,
        canUpload: false,
        canView: false,
        role: null,
        needsApproval: true
      }
    }

    const role = data.role as EventRole

    // Define permissions based on role
    switch (role) {
      case 'contributor':
        return {
          canContribute: true,
          canComment: true,
          canUpload: true,
          canView: true,
          role: 'contributor',
          needsApproval: false
        }
      case 'viewer':
        return {
          canContribute: false,
          canComment: true,
          canUpload: false,
          canView: true,
          role: 'viewer',
          needsApproval: false
        }
      case 'guest':
        return {
          canContribute: false,
          canComment: false,
          canUpload: false,
          canView: true,
          role: 'guest',
          needsApproval: true
        }
      default:
        return {
          canContribute: false,
          canComment: false,
          canUpload: false,
          canView: false,
          role: null,
          needsApproval: true
        }
    }
  } catch (error) {
    console.error('Error checking event permissions:', error)
    return {
      canContribute: false,
      canComment: false,
      canUpload: false,
      canView: false,
      role: null,
      needsApproval: true
    }
  }
}

/**
 * Grant event access to a user
 */
export async function grantEventAccess(
  eventId: string,
  userId: string,
  role: EventRole,
  familyId: string,
  grantedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('event_acl')
      .upsert({
        event_id: eventId,
        user_id: userId,
        role,
        family_id: familyId,
        granted_by: grantedBy
      }, {
        onConflict: 'event_id,user_id'
      })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error granting event access:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Revoke event access from a user
 */
export async function revokeEventAccess(
  eventId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('event_acl')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error revoking event access:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get all ACL entries for an event
 */
export async function getEventAcl(eventId: string): Promise<EventAcl[]> {
  try {
    const { data, error } = await supabase
      .from('event_acl')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []) as EventAcl[]
  } catch (error) {
    console.error('Error getting event ACL:', error)
    return []
  }
}

/**
 * Update role for an existing ACL entry
 */
export async function updateEventRole(
  eventId: string,
  userId: string,
  newRole: EventRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('event_acl')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error updating event role:', error)
    return { success: false, error: String(error) }
  }
}
