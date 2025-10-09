import { supabase } from '@/lib/supabase'
import { getCurrentSpaceId } from '@/lib/spaceUtils'

export interface UpcomingEvent {
  id: string
  type: 'birthday' | 'death_anniversary' | 'life_event'
  person_id?: string
  person_name: string
  title: string
  date: string // YYYY-MM-DD format for this year's occurrence
  original_date?: string // Original date if different (for birthdays)
  days_until: number
  age?: number
  would_be_age?: number
  is_deceased?: boolean
  event_type?: 'anniversary' | 'memorial' | 'custom'
  notes?: string
  recurrence?: string
  family_id?: string // Added for join code functionality
}

/**
 * Calculate the next occurrence date for a given date this year
 */
function getNextOccurrence(originalDate: Date, currentYear: number): Date {
  const month = originalDate.getMonth()
  const day = originalDate.getDate()
  
  // Handle leap day birthdays on non-leap years
  if (month === 1 && day === 29) { // February 29
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0)
    if (!isLeapYear) {
      return new Date(currentYear, 1, 28) // February 28
    }
  }
  
  return new Date(currentYear, month, day)
}

/**
 * Calculate days until a date from today
 */
function calculateDaysUntil(targetDate: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  
  const diffTime = targetDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calculate age from birth date to target date
 */
function calculateAge(birthDate: Date, targetDate: Date): number {
  let age = targetDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = targetDate.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && targetDate.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

/**
 * Format a date as YYYY-MM-DD without timezone shifts
 */
function formatDateYYYYMMDDLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Get upcoming birthdays and life events for the next 30 days
 */
export async function getUpcomingEvents(days: number = 30): Promise<UpcomingEvent[]> {
  try {
    const spaceId = await getCurrentSpaceId()
    if (!spaceId) return []

    const today = new Date()
    const currentYear = today.getFullYear()
    const nextYear = currentYear + 1
    const events: UpcomingEvent[] = []

    // Get all people with birth dates
    const { data: people } = await supabase
      .from('people')
      .select('id, full_name, birth_date, death_date, is_living')
      .eq('family_id', spaceId)
      .not('birth_date', 'is', null)

    if (people) {
      for (const person of people) {
        const birthDate = new Date(person.birth_date + 'T00:00:00')
        const isDeceased = !person.is_living || !!person.death_date

        // Check this year's birthday
        let nextBirthday = getNextOccurrence(birthDate, currentYear)
        let daysUntil = calculateDaysUntil(nextBirthday)

        // If this year's birthday has passed, check next year's
        if (daysUntil < 0) {
          nextBirthday = getNextOccurrence(birthDate, nextYear)
          daysUntil = calculateDaysUntil(nextBirthday)
        }

        if (daysUntil >= 0 && daysUntil <= days) {
          const age = calculateAge(birthDate, nextBirthday)
          
          events.push({
            id: `birthday-${person.id}`,
            type: 'birthday',
            person_id: person.id,
            person_name: person.full_name,
            title: `${person.full_name}'s Birthday`,
            date: formatDateYYYYMMDDLocal(nextBirthday),
            original_date: person.birth_date,
            days_until: daysUntil,
            age: isDeceased ? undefined : age,
            would_be_age: isDeceased ? age : undefined,
            is_deceased: isDeceased
          })
        }

        // Also check death anniversaries if applicable
        if (person.death_date) {
          const deathDate = new Date(person.death_date + 'T00:00:00')
          let nextAnniversary = getNextOccurrence(deathDate, currentYear)
          let daysUntilAnniversary = calculateDaysUntil(nextAnniversary)

          if (daysUntilAnniversary < 0) {
            nextAnniversary = getNextOccurrence(deathDate, nextYear)
            daysUntilAnniversary = calculateDaysUntil(nextAnniversary)
          }

          if (daysUntilAnniversary >= 0 && daysUntilAnniversary <= days) {
            const yearsGone = calculateAge(deathDate, nextAnniversary)
            
            events.push({
              id: `death-anniversary-${person.id}`,
              type: 'death_anniversary',
              person_id: person.id,
              person_name: person.full_name,
              title: `${person.full_name}'s Memorial`,
              date: formatDateYYYYMMDDLocal(nextAnniversary),
              original_date: person.death_date,
              days_until: daysUntilAnniversary,
              age: yearsGone,
              is_deceased: true
            })
          }
        }
      }
    }

    // Get life events
    const { data: lifeEvents } = await supabase
      .from('life_events')
      .select(`
        id, title, type, event_date, event_date_text, date_precision, 
        recurrence, notes, person_id,
        people:person_id(full_name),
        with_people:with_person_id(full_name)
      `)
      .eq('family_id', spaceId)
      .not('event_date', 'is', null)

    if (lifeEvents) {
      for (const event of lifeEvents) {
        const eventDate = new Date(event.event_date + 'T00:00:00')
        
        if (event.recurrence === 'yearly') {
          // Recurring yearly events
          let nextOccurrence = getNextOccurrence(eventDate, currentYear)
          let daysUntil = calculateDaysUntil(nextOccurrence)

          if (daysUntil < 0) {
            nextOccurrence = getNextOccurrence(eventDate, nextYear)
            daysUntil = calculateDaysUntil(nextOccurrence)
          }

          if (daysUntil >= 0 && daysUntil <= days) {
            const yearsAgo = calculateAge(eventDate, nextOccurrence)
            const personName = (event as any).people?.full_name || (event as any).with_people?.full_name

            events.push({
              id: event.id,
              type: 'life_event',
              person_id: event.person_id || undefined,
              person_name: personName || 'Family',
              title: event.title,
              date: formatDateYYYYMMDDLocal(nextOccurrence),
              original_date: event.event_date,
              days_until: daysUntil,
              age: yearsAgo,
              event_type: event.type as 'anniversary' | 'memorial' | 'custom',
              notes: event.notes || undefined,
              recurrence: event.recurrence || undefined
            })
          }
        } else {
          // One-time events
          const daysUntil = calculateDaysUntil(eventDate)
          
          if (daysUntil >= 0 && daysUntil <= days) {
            const personName = (event as any).people?.full_name || (event as any).with_people?.full_name

            events.push({
              id: event.id,
              type: 'life_event',
              person_id: event.person_id || undefined,
              person_name: personName || 'Family',
              title: event.title,
              date: event.event_date,
              days_until: daysUntil,
              event_type: event.type as 'anniversary' | 'memorial' | 'custom',
              notes: event.notes || undefined,
              recurrence: event.recurrence || undefined
            })
          }
        }
      }
    }

    // Sort by days until, then by name
    return events
      .sort((a, b) => {
        if (a.days_until !== b.days_until) {
          return a.days_until - b.days_until
        }
        return a.person_name.localeCompare(b.person_name)
      })

  } catch (error) {
    console.error('Error fetching upcoming events:', error)
    return []
  }
}

/**
 * Get all family events for the past and future 12 months (24 months total)
 */
export async function getAllFamilyEvents(): Promise<UpcomingEvent[]> {
  try {
    const spaceId = await getCurrentSpaceId()
    if (!spaceId) return []

    const today = new Date()
    const currentYear = today.getFullYear()
    const lastYear = currentYear - 1
    const nextYear = currentYear + 1
    const events: UpcomingEvent[] = []

    // Get all people with birth dates
    const { data: people } = await supabase
      .from('people')
      .select('id, full_name, birth_date, death_date, is_living')
      .eq('family_id', spaceId)
      .not('birth_date', 'is', null)

    if (people) {
      for (const person of people) {
        const birthDate = new Date(person.birth_date + 'T00:00:00')
        const isDeceased = !person.is_living || !!person.death_date

        // Check last year, this year, and next year birthdays
        for (const year of [lastYear, currentYear, nextYear]) {
          const birthdayThisYear = getNextOccurrence(birthDate, year)
          const daysUntil = calculateDaysUntil(birthdayThisYear)
          
          // Include events within 365 days past or future
          if (daysUntil >= -365 && daysUntil <= 365) {
            const age = calculateAge(birthDate, birthdayThisYear)
            
            events.push({
              id: `birthday-${person.id}-${year}`,
              type: 'birthday',
              person_id: person.id,
              person_name: person.full_name,
              title: `${person.full_name}'s Birthday`,
              date: formatDateYYYYMMDDLocal(birthdayThisYear),
              original_date: person.birth_date,
              days_until: daysUntil,
              age: isDeceased ? undefined : age,
              would_be_age: isDeceased ? age : undefined,
              is_deceased: isDeceased
            })
          }
        }

        // Also check death anniversaries if applicable
        if (person.death_date) {
          const deathDate = new Date(person.death_date + 'T00:00:00')
          
          for (const year of [lastYear, currentYear, nextYear]) {
            const anniversaryThisYear = getNextOccurrence(deathDate, year)
            const daysUntilAnniversary = calculateDaysUntil(anniversaryThisYear)

            if (daysUntilAnniversary >= -365 && daysUntilAnniversary <= 365) {
              const yearsGone = calculateAge(deathDate, anniversaryThisYear)
              
              events.push({
                id: `death-anniversary-${person.id}-${year}`,
                type: 'death_anniversary',
                person_id: person.id,
                person_name: person.full_name,
                title: `${person.full_name}'s Memorial`,
                date: formatDateYYYYMMDDLocal(anniversaryThisYear),
                original_date: person.death_date,
                days_until: daysUntilAnniversary,
                age: yearsGone,
                is_deceased: true
              })
            }
          }
        }
      }
    }

    // Get life events
    const { data: lifeEvents } = await supabase
      .from('life_events')
      .select(`
        id, title, type, event_date, event_date_text, date_precision, 
        recurrence, notes, person_id,
        people:person_id(full_name),
        with_people:with_person_id(full_name)
      `)
      .eq('family_id', spaceId)
      .not('event_date', 'is', null)

    if (lifeEvents) {
      for (const event of lifeEvents) {
        const eventDate = new Date(event.event_date + 'T00:00:00')
        
        if (event.recurrence === 'yearly') {
          // Recurring yearly events for last, current, and next year
          for (const year of [lastYear, currentYear, nextYear]) {
            const occurrenceThisYear = getNextOccurrence(eventDate, year)
            const daysUntil = calculateDaysUntil(occurrenceThisYear)

            if (daysUntil >= -365 && daysUntil <= 365) {
              const yearsAgo = calculateAge(eventDate, occurrenceThisYear)
              const personName = (event as any).people?.full_name || (event as any).with_people?.full_name

              events.push({
                id: `${event.id}-${year}`,
                type: 'life_event',
                person_id: event.person_id || undefined,
                person_name: personName || 'Family',
                title: event.title,
                date: formatDateYYYYMMDDLocal(occurrenceThisYear),
                original_date: event.event_date,
                days_until: daysUntil,
                age: yearsAgo,
                event_type: event.type as 'anniversary' | 'memorial' | 'custom',
                notes: event.notes || undefined,
                recurrence: event.recurrence || undefined
              })
            }
          }
        } else {
          // One-time events
          const daysUntil = calculateDaysUntil(eventDate)
          
          if (daysUntil >= -365 && daysUntil <= 365) {
            const personName = (event as any).people?.full_name || (event as any).with_people?.full_name

            events.push({
              id: event.id,
              type: 'life_event',
              person_id: event.person_id || undefined,
              person_name: personName || 'Family',
              title: event.title,
              date: event.event_date,
              days_until: daysUntil,
              event_type: event.type as 'anniversary' | 'memorial' | 'custom',
              notes: event.notes || undefined,
              recurrence: event.recurrence || undefined
            })
          }
        }
      }
    }

    // Remove duplicates and sort by days until, then by name
    const uniqueEvents = events.filter((event, index, self) => 
      index === self.findIndex((e) => e.id === event.id && e.date === event.date)
    )

    return uniqueEvents
      .sort((a, b) => {
        if (a.days_until !== b.days_until) {
          return a.days_until - b.days_until
        }
        return a.person_name.localeCompare(b.person_name)
      })

  } catch (error) {
    console.error('Error fetching all family events:', error)
    return []
  }
}

/**
 * Create a new life event
 */
export async function createLifeEvent(eventData: {
  title: string
  type: 'anniversary' | 'memorial' | 'custom'
  event_date?: string
  event_date_text?: string
  date_precision?: 'ymd' | 'md' | 'y'
  person_id?: string
  with_person_id?: string
  recurrence?: 'yearly' | 'none'
  notes?: string
}): Promise<string | null> {
  try {
    const spaceId = await getCurrentSpaceId()
    if (!spaceId) throw new Error('No active space found')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('life_events')
      .insert({
        ...eventData,
        family_id: spaceId,
        created_by: user.id,
        recurrence: eventData.recurrence || 'yearly'
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  } catch (error) {
    console.error('Error creating life event:', error)
    return null
  }
}

/**
 * Update a person's birth date
 */
export async function updatePersonBirthDate(personId: string, birthDate: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('people')
      .update({ birth_date: birthDate })
      .eq('id', personId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating person birth date:', error)
    return false
  }
}