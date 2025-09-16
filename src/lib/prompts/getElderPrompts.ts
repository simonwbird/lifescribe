import { supabase } from '@/integrations/supabase/client'

export type ElderPrompt = {
  id: string
  text: string
  kind: 'upcoming' | 'personal' | 'general'
  context?: { 
    personId?: string
    personName?: string
    event?: 'birthday' | 'anniversary'
  }
}

const GENERAL_PROMPTS: Omit<ElderPrompt, 'id'>[] = [
  // People
  { text: "Tell us about your best friend growing up.", kind: 'general' },
  { text: "Who taught you something important?", kind: 'general' },
  { text: "Describe someone who always made you laugh.", kind: 'general' },
  { text: "Tell us about a teacher who made a difference.", kind: 'general' },
  
  // Places
  { text: "Describe your childhood home.", kind: 'general' },
  { text: "Tell us about a neighborhood you loved.", kind: 'general' },
  { text: "Describe your favorite place to visit.", kind: 'general' },
  { text: "Tell us about a place that felt like home.", kind: 'general' },
  
  // Firsts
  { text: "Tell us about your first job.", kind: 'general' },
  { text: "Describe your first car or bike.", kind: 'general' },
  { text: "Tell us about your first day of school.", kind: 'general' },
  { text: "Describe the first time you fell in love.", kind: 'general' },
  
  // Food & Music
  { text: "Describe a meal you loved and who made it.", kind: 'general' },
  { text: "Tell us about a song that takes you back.", kind: 'general' },
  { text: "What was your family's favorite recipe?", kind: 'general' },
  { text: "Describe a celebration meal you remember.", kind: 'general' },
  
  // Advice & Wisdom
  { text: "What advice would you give your 20-year-old self?", kind: 'general' },
  { text: "Tell us about a lesson life taught you.", kind: 'general' },
  { text: "What's the best advice you ever received?", kind: 'general' },
  { text: "Share something you wish everyone knew.", kind: 'general' },
  
  // Pride & Resilience
  { text: "Tell us about a time you felt really proud.", kind: 'general' },
  { text: "Describe a hard time you got through.", kind: 'general' },
  { text: "Tell us about something you accomplished.", kind: 'general' },
  { text: "Describe a time you helped someone.", kind: 'general' },
]

export async function getElderPrompts(profileId: string, spaceId: string): Promise<ElderPrompt[]> {
  const today = new Date()
  const twoWeeksFromNow = new Date(today)
  twoWeeksFromNow.setDate(today.getDate() + 14)
  
  const twoWeeksAgo = new Date(today)
  twoWeeksAgo.setDate(today.getDate() - 14)

  const prompts: ElderPrompt[] = []

  try {
    // Check for upcoming birthdays and anniversaries
    const { data: upcomingEvents } = await supabase
      .from('people')
      .select('id, full_name, birth_date')
      .eq('family_id', spaceId)
      .not('birth_date', 'is', null)

    if (upcomingEvents) {
      for (const person of upcomingEvents) {
        if (person.birth_date) {
          const birthDate = new Date(person.birth_date)
          // Create this year's birthday
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
          
          // If birthday has passed this year, check next year
          if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1)
          }

          // Check if birthday is within 2 weeks
          if (thisYearBirthday >= today && thisYearBirthday <= twoWeeksFromNow) {
            const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            const promptText = daysUntil <= 1 
              ? `Record a birthday message for ${person.full_name}.`
              : `${person.full_name}'s birthday is coming up. Share a memory.`
            
            prompts.push({
              id: `upcoming-birthday-${person.id}`,
              text: promptText,
              kind: 'upcoming',
              context: {
                personId: person.id,
                personName: person.full_name,
                event: 'birthday'
              }
            })
          }
        }
      }
    }

    // Get user's favorites for personalized prompts
    const { data: peopleWithFavorites } = await supabase
      .from('people')
      .select('favorites')
      .eq('family_id', spaceId)
      .not('favorites', 'is', null)

    const allFavorites = peopleWithFavorites?.reduce((acc, person) => {
      if (person.favorites && typeof person.favorites === 'object') {
        return { ...acc, ...person.favorites }
      }
      return acc
    }, {} as Record<string, any>) || {}

    // Generate personalized prompts based on favorites
    if (allFavorites.favorite_place) {
      prompts.push({
        id: 'personal-place',
        text: `Tell us about a trip to ${allFavorites.favorite_place}.`,
        kind: 'personal'
      })
    }

    if (allFavorites.favorite_music) {
      prompts.push({
        id: 'personal-music',
        text: `Tell us about ${allFavorites.favorite_music} and why you love it.`,
        kind: 'personal'
      })
    }

    // Get recently used prompts to avoid repeats
    const { data: recentStories } = await supabase
      .from('stories')
      .select('prompt_id')
      .eq('family_id', spaceId)
      .gte('created_at', twoWeeksAgo.toISOString())
      .not('prompt_id', 'is', null)

    const recentPromptIds = new Set(recentStories?.map(s => s.prompt_id) || [])

    // Fill remaining slots with general prompts (avoid recent repeats)
    const availableGeneral = GENERAL_PROMPTS.filter(p => !recentPromptIds.has(p.text))
    const shuffledGeneral = availableGeneral.sort(() => Math.random() - 0.5)

    // Add general prompts to reach exactly 3 total
    const needed = Math.max(0, 3 - prompts.length)
    for (let i = 0; i < needed && i < shuffledGeneral.length; i++) {
      prompts.push({
        ...shuffledGeneral[i],
        id: `general-${i}-${Date.now()}`
      })
    }

    // Ensure we always have at least 3 prompts
    while (prompts.length < 3) {
      const fallback = GENERAL_PROMPTS[prompts.length % GENERAL_PROMPTS.length]
      prompts.push({
        ...fallback,
        id: `fallback-${prompts.length}-${Date.now()}`
      })
    }

  } catch (error) {
    console.error('Error generating elder prompts:', error)
    
    // Fallback to general prompts
    const shuffled = GENERAL_PROMPTS.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3).map((prompt, index) => ({
      ...prompt,
      id: `fallback-${index}-${Date.now()}`
    }))
  }

  return prompts.slice(0, 3)
}

export function truncatePrompt(text: string, maxLength: number = 90): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 1) + '…'
}