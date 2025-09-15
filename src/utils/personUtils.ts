import { differenceInYears, format, isLeapYear } from 'date-fns'
import { Person as BasePerson } from '@/lib/familyTreeTypes'

export interface Person extends Omit<BasePerson, 'favorites'> {
  bio?: string
  favorites?: {
    music?: string[]
    foods?: string[]
    places?: string[]
    books?: string[]
    sports?: string[]
  } | null
  pinned_story_ids?: string[]
  claimed_by_profile_id?: string
}

export interface UserRole {
  role: 'admin' | 'member' | 'guest'
  isOwner: boolean
}

export const computeAge = (birthDate?: string, deathDate?: string, refDate: Date = new Date()): number | null => {
  if (!birthDate) return null
  
  const birth = new Date(birthDate)
  const reference = deathDate ? new Date(deathDate) : refDate
  
  return differenceInYears(reference, birth)
}

export const isMemorialized = (person: Person): boolean => {
  return Boolean(person.death_date || person.is_living === false)
}

export const getPageType = (person: Person): 'life' | 'tribute' => {
  return isMemorialized(person) ? 'tribute' : 'life'
}

export const getAgeLabel = (person: Person): string | null => {
  const age = computeAge(person.birth_date, person.death_date)
  if (!age) return null
  
  if (isMemorialized(person)) {
    return `Would be ${age}`
  } else {
    return `${age}`
  }
}

export const getUserRole = (
  person: Person, 
  currentUserId: string | null, 
  memberRole: string | null
): UserRole => {
  const isOwner = Boolean(
    currentUserId && 
    person.claimed_by_profile_id === currentUserId
  )
  
  const role = memberRole as 'admin' | 'member' | 'guest' || 'guest'
  
  return { role, isOwner }
}

export const canEdit = (userRole: UserRole): boolean => {
  return userRole.isOwner || userRole.role === 'admin'
}

export const canModerate = (userRole: UserRole): boolean => {
  return userRole.isOwner || userRole.role === 'admin'
}

export const canAddContent = (userRole: UserRole): boolean => {
  return userRole.role !== 'guest'
}

export const nextBirthdayOccurrence = (birthDate?: string): Date | null => {
  if (!birthDate) return null
  
  const birth = new Date(birthDate)
  const now = new Date()
  const currentYear = now.getFullYear()
  
  let nextBirthday = new Date(currentYear, birth.getMonth(), birth.getDate())
  
  // Handle leap day: Feb 29 becomes Feb 28 on non-leap years
  if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(nextBirthday)) {
    nextBirthday.setDate(28)
  }
  
  // If birthday already passed this year, use next year
  if (nextBirthday < now) {
    nextBirthday = new Date(currentYear + 1, birth.getMonth(), birth.getDate())
    if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(nextBirthday)) {
      nextBirthday.setDate(28)
    }
  }
  
  return nextBirthday
}

export const formatMemorialDate = (deathDate: string): string => {
  return format(new Date(deathDate), 'MMMM d, yyyy')
}

export const initials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}