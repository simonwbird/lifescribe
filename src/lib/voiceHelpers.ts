// Voice capture helper functions for smart suggestions

export function autoTitle(text: string): string {
  if (!text || text.length < 10) return ''
  
  // Extract first meaningful sentence or phrase
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5)
  if (sentences.length === 0) return ''
  
  let title = sentences[0].trim()
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1)
  
  // Truncate to reasonable length
  if (title.length > 60) {
    title = title.substring(0, 57) + '...'
  }
  
  // Clean up common speech patterns
  title = title
    .replace(/^(um|uh|so|well|like)\s+/i, '')
    .replace(/\s+(um|uh|like)\s+/gi, ' ')
    .trim()
  
  return title
}

export async function suggestPeople(text: string): Promise<Array<{ id?: string; name: string }>> {
  if (!text) return []
  
  // Common name patterns
  const namePatterns = [
    /\b(my|our)\s+(mom|mother|dad|father|sister|brother|son|daughter|husband|wife|grandma|grandmother|grandpa|grandfather)\b/gi,
    /\b(aunt|uncle|cousin|nephew|niece)\s+([A-Z][a-z]+)\b/gi,
    /\b([A-Z][a-z]+)\s+(and|&)\s+([A-Z][a-z]+)\b/gi,
    /\b([A-Z][a-z]+)'s\b/gi,
    /\bwith\s+([A-Z][a-z]+)\b/gi
  ]
  
  const suggestions: Array<{ name: string }> = []
  const found = new Set<string>()
  
  for (const pattern of namePatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && /^[A-Z][a-z]+$/.test(match[1]) && !found.has(match[1])) {
        suggestions.push({ name: match[1] })
        found.add(match[1])
      }
      if (match[2] && /^[A-Z][a-z]+$/.test(match[2]) && !found.has(match[2])) {
        suggestions.push({ name: match[2] })
        found.add(match[2])
      }
      if (match[3] && /^[A-Z][a-z]+$/.test(match[3]) && !found.has(match[3])) {
        suggestions.push({ name: match[3] })
        found.add(match[3])
      }
    }
  }
  
  // TODO: In a real implementation, match against existing family members
  // const existingPeople = await fetchFamilyMembers()
  // return suggestions.map(s => {
  //   const existing = existingPeople.find(p => p.name.toLowerCase() === s.name.toLowerCase())
  //   return existing ? { id: existing.id, name: existing.name } : s
  // })
  
  return suggestions.slice(0, 5) // Limit to 5 suggestions
}

export function inferDate(text: string): { value: string; precision: 'day' | 'month' | 'year' | 'unknown' } {
  if (!text) return { value: '', precision: 'unknown' }
  
  // Date patterns
  const datePatterns = [
    // Specific dates
    { pattern: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, precision: 'day' as const },
    { pattern: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, precision: 'day' as const },
    
    // Month and year
    { pattern: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi, precision: 'month' as const },
    { pattern: /\b(\d{1,2})\/(\d{4})\b/g, precision: 'month' as const },
    
    // Just year
    { pattern: /\bin\s+(\d{4})\b/gi, precision: 'year' as const },
    { pattern: /\back\s+in\s+(\d{4})\b/gi, precision: 'year' as const },
    
    // Relative dates
    { pattern: /\byesterday\b/gi, precision: 'day' as const },
    { pattern: /\blast\s+(week|month|year)\b/gi, precision: 'month' as const },
    { pattern: /\bthis\s+(morning|afternoon|evening)\b/gi, precision: 'day' as const }
  ]
  
  const today = new Date()
  
  for (const { pattern, precision } of datePatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      if (match[0].toLowerCase() === 'yesterday') {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return { value: yesterday.toISOString().split('T')[0], precision: 'day' }
      }
      
      if (match[0].toLowerCase().includes('this morning') || 
          match[0].toLowerCase().includes('this afternoon') || 
          match[0].toLowerCase().includes('this evening')) {
        return { value: today.toISOString().split('T')[0], precision: 'day' }
      }
      
      if (match[1] && /^\d{4}$/.test(match[1])) {
        // Year only
        return { value: `${match[1]}-01-01`, precision: 'year' }
      }
      
      if (match[1] && match[2] && /^\d{4}$/.test(match[2])) {
        // Month and year
        const monthName = match[1].toLowerCase()
        const months = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december']
        const monthIndex = months.indexOf(monthName)
        if (monthIndex !== -1) {
          return { value: `${match[2]}-${String(monthIndex + 1).padStart(2, '0')}-01`, precision: 'month' }
        }
      }
      
      if (match[1] && match[2] && match[3]) {
        // Full date MM/DD/YYYY or YYYY-MM-DD
        try {
          let dateStr: string
          if (match[3].length === 4) {
            // MM/DD/YYYY
            dateStr = `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
          } else {
            // YYYY-MM-DD
            dateStr = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
          }
          
          const date = new Date(dateStr)
          if (!isNaN(date.getTime())) {
            return { value: dateStr, precision: 'day' }
          }
        } catch (e) {
          // Invalid date, continue searching
        }
      }
    }
  }
  
  return { value: '', precision: 'unknown' }
}