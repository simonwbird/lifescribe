/**
 * DEPRECATED: Legacy date utilities - use @/utils/date.ts instead
 * These functions remain for backward compatibility during migration
 * TODO: Remove after all components migrated to new centralized utilities
 */

import { formatForUser, getCurrentUserRegion, type RegionPrefs } from './date'

/**
 * @deprecated Use computeAge from @/utils/personUtils.ts or formatForUser with 'relative' instead
 */
export const calculateAge = (birthDate: string | null, deathDate: string | null, isLiving: boolean) => {
  if (!birthDate) return null
  
  const birth = new Date(birthDate)
  const compareDate = deathDate ? new Date(deathDate) : new Date()
  
  const age = compareDate.getFullYear() - birth.getFullYear()
  const monthDiff = compareDate.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && compareDate.getDate() < birth.getDate())) {
    return age - 1
  }
  
  return age
}

export const calculateDaysUntilBirthday = (birthDate: string | null) => {
  if (!birthDate) return null
  
  const birth = new Date(birthDate)
  const today = new Date()
  const thisYear = today.getFullYear()
  
  // Handle Feb 29 on non-leap years
  let nextBirthday = new Date(thisYear, birth.getMonth(), birth.getDate())
  if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(thisYear)) {
    nextBirthday = new Date(thisYear, 1, 28) // Feb 28
  }
  
  if (nextBirthday < today) {
    const nextYear = thisYear + 1
    nextBirthday = new Date(nextYear, birth.getMonth(), birth.getDate())
    if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(nextYear)) {
      nextBirthday = new Date(nextYear, 1, 28)
    }
  }
  
  const diffTime = nextBirthday.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const isLeapYear = (year: number) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * @deprecated Use formatForUser(birthDate, 'dateOnly', userRegion) instead
 * NEW: Also supports relative formatting for countdowns
 */
export const formatUpcoming = (birthDate: string | null, isLiving: boolean) => {
  if (!birthDate || !isLiving) return null
  
  const days = calculateDaysUntilBirthday(birthDate)
  if (days === null) return null
  
  // NEW: Use centralized formatting for consistent locale support
  const userRegion = getCurrentUserRegion()
  const formattedDate = formatForUser(birthDate, 'dateOnly', userRegion)
  
  if (days === 0) return `${formattedDate} • Today!`
  if (days === 1) return `${formattedDate} • Tomorrow`
  return `${formattedDate} • in ${days}d`
}

export const computeAge = (birthDate: string | null, referenceDate?: Date, deathDate?: string | null) => {
  if (!birthDate) return null
  
  const birth = new Date(birthDate)
  const reference = referenceDate || (deathDate ? new Date(deathDate) : new Date())
  
  return calculateAge(birthDate, deathDate || null, !deathDate)
}