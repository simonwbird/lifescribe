/**
 * Utility functions for determining person state and permissions
 */

import type { Person } from '@/lib/familyTreeTypes'

export interface PersonState {
  isDeceased: boolean
  hasAccountLink: boolean
  inviteStatus: 'pending' | 'accepted' | 'expired' | 'none'
  hasContent: boolean
  canAdmin: boolean
  displayStatus: 'living_not_on_app' | 'living_invited' | 'living_joined' | 'deceased'
}

export interface PersonAccounts {
  [personId: string]: {
    user_id: string
    member_role?: string
  }
}

export interface CurrentUser {
  role: 'admin' | 'member' | 'guest' | null
  id: string | null
}

export function derivePersonState(
  person: Person & { 
    account_status?: string
    member_role?: string | null
    stories_count?: number
    photos_count?: number
  },
  personAccounts: PersonAccounts,
  currentUser: CurrentUser
): PersonState {
  // 1. Derive isDeceased
  const isDeceased = person.is_living === false || !!person.death_date

  // 2. Derive hasAccountLink
  const hasAccountLink = !!personAccounts[person.id]

  // 3. Derive inviteStatus
  let inviteStatus: PersonState['inviteStatus'] = 'none'
  if (person.account_status === 'invited') {
    inviteStatus = 'pending' // Simplified - could check expiry
  } else if (person.account_status === 'joined') {
    inviteStatus = 'accepted'
  }

  // 4. Derive hasContent
  const hasContent = (person.stories_count || 0) + (person.photos_count || 0) > 0

  // 5. Derive canAdmin
  const canAdmin = currentUser.role === 'admin'

  // 6. Derive display status for easy conditional rendering
  let displayStatus: PersonState['displayStatus']
  if (isDeceased) {
    displayStatus = 'deceased'
  } else if (person.account_status === 'joined') {
    displayStatus = 'living_joined'
  } else if (person.account_status === 'invited') {
    displayStatus = 'living_invited'
  } else {
    displayStatus = 'living_not_on_app'
  }

  return {
    isDeceased,
    hasAccountLink,
    inviteStatus,
    hasContent,
    canAdmin,
    displayStatus
  }
}

export function getActionLabel(action: string, personName: string, isDeceased: boolean): string {
  switch (action) {
    case 'record_memory':
      return isDeceased ? `Record a memory of ${personName}` : `Record a memory for ${personName}`
    case 'open_page':
      return isDeceased ? 'Open Tribute Page' : 'Open Life Page'
    case 'memorialize':
      return 'Memorialize'
    case 'revert_memorialize':
      return 'Revert memorialization'
    case 'edit_details':
      return 'Edit details'
    case 'invite_manage':
      return 'Invite / Manage access'
    case 'manage_invite':
      return 'Manage invite'
    case 'manage_access':
      return 'Manage access'
    case 'add_photo':
      return 'Add photo'
    case 'delete':
      return 'Delete'
    default:
      return action
  }
}

export function canDeletePerson(personState: PersonState, person: Person): { 
  canDelete: boolean
  reason?: string 
} {
  if (personState.hasAccountLink) {
    return {
      canDelete: false,
      reason: "Cannot delete: this person is linked to a member account."
    }
  }

  if (personState.hasContent) {
    return {
      canDelete: false,
      reason: "Cannot delete: this person has stories or photos."
    }
  }

  return { canDelete: true }
}