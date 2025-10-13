import { format, isSameDay, isSameMonth } from 'date-fns'

interface Spark {
  id: string
  text: string
  category: string
  relationship_targets?: string[]
  seasonal_tags?: string[]
  weight: number
}

interface Person {
  first_name?: string
  birth_date?: string
  death_date?: string
}

interface Viewer {
  relationship_to_person?: string
}

interface Context {
  type?: 'photo' | 'place' | 'date'
  place?: string
}

interface SelectSparkParams {
  person: Person
  viewer?: Viewer
  context?: Context
  recentIds?: string[]
}

function getSeasonalTags(person: Person): string[] {
  const tags: string[] = []
  const today = new Date()
  
  // Check if near birthday
  if (person.birth_date) {
    const birthDate = new Date(person.birth_date)
    if (isSameMonth(today, birthDate)) {
      tags.push('birthday')
    }
  }
  
  // Check if near death anniversary
  if (person.death_date) {
    const deathDate = new Date(person.death_date)
    if (isSameMonth(today, deathDate)) {
      tags.push('anniv', 'anniversary')
    }
  }
  
  // Check holidays
  const month = today.getMonth()
  const day = today.getDate()
  
  if (month === 11 && day >= 20) tags.push('holiday', 'christmas')
  if (month === 10 && day >= 20) tags.push('holiday', 'thanksgiving')
  if (month === 0 && day === 1) tags.push('holiday', 'newyear')
  if (month === 6 && day === 4) tags.push('holiday', 'july4')
  
  return tags
}

export function selectSpark(
  { person, viewer, context, recentIds = [] }: SelectSparkParams,
  sparks: Spark[]
): Spark | null {
  if (!sparks.length) return null
  
  const rel = viewer?.relationship_to_person?.toLowerCase() || 'general'
  const seasonalTags = getSeasonalTags(person)
  
  // Score each spark
  const scored = sparks.map(s => {
    let score = s.weight
    
    // Boost for relationship match
    if (s.relationship_targets?.some(target => 
      target.toLowerCase() === rel || target.toLowerCase() === 'universal'
    )) {
      score += 3
    }
    
    // Boost for seasonal relevance
    if (s.seasonal_tags?.some(tag => seasonalTags.includes(tag))) {
      score += 2
    }
    
    // Boost for context match
    if (context?.type && s.category === context.type) {
      score += 2
    }
    
    // Penalize recent sparks
    if (recentIds.includes(s.id)) {
      score -= 5
    }
    
    return { s, score }
  })
  
  // Sort by score and find first non-recent spark with positive score
  const sorted = scored.sort((a, b) => b.score - a.score)
  const top = sorted.find(x => x.score > 0 && !recentIds.includes(x.s.id))
  
  // Fallback to random if no good match
  if (!top) {
    const available = sparks.filter(s => !recentIds.includes(s.id))
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)]
    }
    return sparks[Math.floor(Math.random() * sparks.length)]
  }
  
  return top.s
}

export function interpolateSpark(sparkText: string, person: Person, context?: Context): string {
  let text = sparkText
  const firstName = person.first_name || 'them'
  text = text.replace(/\{\{first_name\}\}/g, firstName)
  if (context?.place) {
    text = text.replace(/\{\{place\}\}/g, context.place)
  }
  return text
}
