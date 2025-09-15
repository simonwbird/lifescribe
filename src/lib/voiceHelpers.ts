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
  
  const today = new Date()
  const currentYear = today.getFullYear()
  
  // More comprehensive date patterns for natural speech
  const datePatterns = [
    // Specific dates with various formats
    { pattern: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, precision: 'day' as const, type: 'mdy' },
    { pattern: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, precision: 'day' as const, type: 'ymd' },
    { pattern: /\b(\d{1,2})-(\d{1,2})-(\d{4})\b/g, precision: 'day' as const, type: 'mdy' },
    
    // Month day year patterns (common in speech)
    { pattern: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/gi, precision: 'day' as const, type: 'month_day_year' },
    { pattern: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(st|nd|rd|th),?\s+(\d{4})\b/gi, precision: 'day' as const, type: 'month_ordinal_year' },
    
    // Month and year only
    { pattern: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi, precision: 'month' as const, type: 'month_year' },
    { pattern: /\bin\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+of\s+(\d{4})\b/gi, precision: 'month' as const, type: 'month_year' },
    
    // Year only patterns
    { pattern: /\bin\s+(\d{4})\b/gi, precision: 'year' as const, type: 'year' },
    { pattern: /\back\s+in\s+(\d{4})\b/gi, precision: 'year' as const, type: 'year' },
    { pattern: /\bduring\s+(\d{4})\b/gi, precision: 'year' as const, type: 'year' },
    { pattern: /\bthe\s+year\s+(\d{4})\b/gi, precision: 'year' as const, type: 'year' },
    
    // Relative date patterns
    { pattern: /\byesterday\b/gi, precision: 'day' as const, type: 'yesterday' },
    { pattern: /\btoday\b/gi, precision: 'day' as const, type: 'today' },
    { pattern: /\bthis\s+(morning|afternoon|evening)\b/gi, precision: 'day' as const, type: 'today' },
    { pattern: /\blast\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, precision: 'day' as const, type: 'last_weekday' },
    { pattern: /\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, precision: 'day' as const, type: 'this_weekday' },
    { pattern: /\blast\s+week\b/gi, precision: 'month' as const, type: 'last_week' },
    { pattern: /\blast\s+month\b/gi, precision: 'month' as const, type: 'last_month' },
    { pattern: /\blast\s+year\b/gi, precision: 'year' as const, type: 'last_year' },
    
    // Season patterns
    { pattern: /\blast\s+(spring|summer|fall|autumn|winter)\b/gi, precision: 'month' as const, type: 'last_season' },
    { pattern: /\bthis\s+(spring|summer|fall|autumn|winter)\b/gi, precision: 'month' as const, type: 'this_season' },
    { pattern: /\bin\s+the\s+(spring|summer|fall|autumn|winter)\s+of\s+(\d{4})\b/gi, precision: 'month' as const, type: 'season_year' },
    
    // Holiday patterns
    { pattern: /\bchristmas\s+(\d{4})\b/gi, precision: 'day' as const, type: 'christmas' },
    { pattern: /\bthanksgiving\s+(\d{4})\b/gi, precision: 'day' as const, type: 'thanksgiving' },
    { pattern: /\bnew\s+year'?s?\s+(\d{4})\b/gi, precision: 'day' as const, type: 'newyears' }
  ]
  
  const months = ['january', 'february', 'march', 'april', 'may', 'june',
                 'july', 'august', 'september', 'october', 'november', 'december']
  
  for (const { pattern, precision, type } of datePatterns) {
    const matches = Array.from(text.matchAll(pattern))
    
    for (const match of matches) {
      try {
        let dateResult = { value: '', precision }
        
        switch (type) {
          case 'mdy': // MM/DD/YYYY or MM-DD-YYYY
            if (match[1] && match[2] && match[3]) {
              const month = parseInt(match[1])
              const day = parseInt(match[2])
              const year = parseInt(match[3])
              if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= currentYear + 10) {
                dateResult.value = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              }
            }
            break
            
          case 'ymd': // YYYY-MM-DD
            if (match[1] && match[2] && match[3]) {
              const year = parseInt(match[1])
              const month = parseInt(match[2])
              const day = parseInt(match[3])
              if (year >= 1900 && year <= currentYear + 10 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                dateResult.value = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              }
            }
            break
            
          case 'month_day_year': // January 15, 2024
            if (match[1] && match[2] && match[3]) {
              const monthName = match[1].toLowerCase()
              const monthIndex = months.indexOf(monthName)
              const day = parseInt(match[2])
              const year = parseInt(match[3])
              if (monthIndex !== -1 && day >= 1 && day <= 31 && year >= 1900 && year <= currentYear + 10) {
                dateResult.value = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              }
            }
            break
            
          case 'month_ordinal_year': // January 15th, 2024
            if (match[1] && match[2] && match[4]) {
              const monthName = match[1].toLowerCase()
              const monthIndex = months.indexOf(monthName)
              const day = parseInt(match[2])
              const year = parseInt(match[4])
              if (monthIndex !== -1 && day >= 1 && day <= 31 && year >= 1900 && year <= currentYear + 10) {
                dateResult.value = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              }
            }
            break
            
          case 'month_year': // January 2024
            if (match[1] && match[2]) {
              const monthName = match[1].toLowerCase()
              const monthIndex = months.indexOf(monthName)
              const year = parseInt(match[2])
              if (monthIndex !== -1 && year >= 1900 && year <= currentYear + 10) {
                dateResult.value = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-01`
              }
            }
            break
            
          case 'year': // 2024
            if (match[1]) {
              const year = parseInt(match[1])
              if (year >= 1900 && year <= currentYear + 10) {
                dateResult.value = `${year}-01-01`
              }
            }
            break
            
          case 'yesterday':
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            dateResult.value = yesterday.toISOString().split('T')[0]
            break
            
          case 'today':
            dateResult.value = today.toISOString().split('T')[0]
            break
            
          case 'last_week':
            const lastWeek = new Date(today)
            lastWeek.setDate(today.getDate() - 7)
            dateResult.value = lastWeek.toISOString().split('T')[0]
            dateResult.precision = 'month'
            break
            
          case 'last_month':
            const lastMonth = new Date(today)
            lastMonth.setMonth(today.getMonth() - 1)
            dateResult.value = lastMonth.toISOString().split('T')[0]
            dateResult.precision = 'month'
            break
            
          case 'last_year':
            const lastYear = new Date(today)
            lastYear.setFullYear(today.getFullYear() - 1)
            dateResult.value = lastYear.toISOString().split('T')[0]
            dateResult.precision = 'year'
            break
            
          case 'christmas':
            if (match[1]) {
              const year = parseInt(match[1])
              if (year >= 1900 && year <= currentYear + 10) {
                dateResult.value = `${year}-12-25`
              }
            }
            break
            
          case 'thanksgiving':
            if (match[1]) {
              const year = parseInt(match[1])
              if (year >= 1900 && year <= currentYear + 10) {
                // Approximate Thanksgiving as fourth Thursday of November
                dateResult.value = `${year}-11-25`
              }
            }
            break
            
          case 'newyears':
            if (match[1]) {
              const year = parseInt(match[1])
              if (year >= 1900 && year <= currentYear + 10) {
                dateResult.value = `${year}-01-01`
              }
            }
            break
        }
        
        if (dateResult.value) {
          return dateResult
        }
      } catch (e) {
        // Continue to next pattern if this one fails
        continue
      }
    }
  }
  
  return { value: '', precision: 'unknown' }
}