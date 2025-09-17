import { supabase } from '@/lib/supabase'

export interface SearchResult {
  id: string
  type: 'person' | 'story' | 'photo' | 'voice' | 'video' | 'recipe' | 'object' | 'pet' | 'property' | 'document' | 'prompt' | 'comment'
  title: string
  subtitle?: string
  snippet?: string
  url: string
  image?: string
  metadata: {
    date?: string
    people?: string[]
    places?: string[]
    tags?: string[]
    privacy?: 'family' | 'private' | 'custom'
  }
  score: number
}

export interface SearchFilters {
  type?: string[]
  person?: string[]
  place?: string[]
  year?: number[]
  before?: number
  after?: number
  has?: string[] // 'audio', 'video', 'doc', 'ocr'
  tag?: string[]
}

export interface SearchOptions {
  query: string
  filters?: SearchFilters
  familyId: string
  limit?: number
  offset?: number
}

export interface SearchSuggestion {
  id: string
  type: 'person' | 'place' | 'story' | 'media' | 'collection' | 'action'
  title: string
  subtitle?: string
  url?: string
  icon: string
}

export interface SmartAnswer {
  type: 'occupancy' | 'media_slice' | 'occasion' | 'recipe_list'
  title: string
  data: any
  refinements?: Array<{
    type: string
    label: string
    filter: Partial<SearchFilters>
  }>
}

export class SearchService {
  private static async getUserFamilies(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('members')
      .select('family_id')
      .eq('profile_id', userId)
    
    return data?.map(m => m.family_id) || []
  }

  private static parseQuery(query: string): { terms: string[], filters: SearchFilters } {
    const filters: SearchFilters = {}
    const terms: string[] = []
    
    // Extract operators
    const operators = [
      { pattern: /type:(\w+)/g, key: 'type' },
      { pattern: /person:"([^"]+)"/g, key: 'person' },
      { pattern: /place:"([^"]+)"/g, key: 'place' },
      { pattern: /year:(\d{4})/g, key: 'year' },
      { pattern: /before:(\d{4})/g, key: 'before' },
      { pattern: /after:(\d{4})/g, key: 'after' },
      { pattern: /has:(\w+)/g, key: 'has' },
      { pattern: /tag:(\w+)/g, key: 'tag' }
    ]

    let remainingQuery = query
    
    operators.forEach(({ pattern, key }) => {
      let match
      while ((match = pattern.exec(query)) !== null) {
        const value = match[1]
        if (key === 'before' || key === 'after') {
          filters[key] = parseInt(value)
        } else if (key === 'year') {
          filters.year = filters.year || []
          filters.year.push(parseInt(value))
        } else {
          filters[key] = filters[key] || []
          filters[key].push(value)
        }
        remainingQuery = remainingQuery.replace(match[0], '')
      }
    })

    // Remaining text becomes search terms
    terms.push(...remainingQuery.trim().split(/\s+/).filter(Boolean))
    
    return { terms, filters }
  }

  static async search(options: SearchOptions): Promise<{
    results: SearchResult[]
    total: number
    smartAnswer?: SmartAnswer
  }> {
    const { query, filters = {}, familyId, limit = 20, offset = 0 } = options
    const { terms, filters: parsedFilters } = this.parseQuery(query)
    const combinedFilters = { ...parsedFilters, ...filters }
    
    const results: SearchResult[] = []
    let smartAnswer: SmartAnswer | undefined

    // Search across different entity types
    const searches = [
      this.searchPeople(terms, combinedFilters, familyId),
      this.searchStories(terms, combinedFilters, familyId),
      this.searchRecipes(terms, combinedFilters, familyId),
      this.searchProperties(terms, combinedFilters, familyId),
      this.searchPets(terms, combinedFilters, familyId)
    ]

    const searchResults = await Promise.all(searches)
    results.push(...searchResults.flat())

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score)

    // Generate smart answer for specific patterns
    smartAnswer = await this.generateSmartAnswer(query, terms, familyId)

    return {
      results: results.slice(offset, offset + limit),
      total: results.length,
      smartAnswer
    }
  }

  private static async searchPeople(terms: string[], filters: SearchFilters, familyId: string): Promise<SearchResult[]> {
    if (filters.type && !filters.type.includes('person')) return []

    let query = supabase
      .from('people')
      .select('*')
      .eq('family_id', familyId)

    if (terms.length > 0) {
      const searchTerm = terms.join(' ')
      query = query.or(`full_name.ilike.%${searchTerm}%,given_name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%`)
    }

    const { data: people } = await query.limit(10)

    return (people || []).map(person => ({
      id: person.id,
      type: 'person' as const,
      title: person.full_name,
      subtitle: person.birth_year ? `Born ${person.birth_year}` : undefined,
      url: `/people/${person.id}`,
      image: person.avatar_url,
      metadata: {
        date: person.birth_date,
        tags: []
      },
      score: this.calculatePersonScore(person, terms)
    }))
  }

  private static async searchStories(terms: string[], filters: SearchFilters, familyId: string): Promise<SearchResult[]> {
    if (filters.type && !filters.type.includes('story')) return []

    let query = supabase
      .from('stories')
      .select(`
        *,
        profiles:profile_id (full_name),
        person_story_links (
          people (full_name)
        )
      `)
      .eq('family_id', familyId)

    if (terms.length > 0) {
      const searchTerm = terms.join(' ')
      query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    }

    if (filters.year) {
      query = query.in('occurred_on', filters.year.map(y => `${y}-01-01`))
    }

    if (filters.after) {
      query = query.gte('occurred_on', `${filters.after}-01-01`)
    }

    if (filters.before) {
      query = query.lte('occurred_on', `${filters.before}-12-31`)
    }

    const { data: stories } = await query.limit(20)

    return (stories || []).map(story => ({
      id: story.id,
      type: 'story' as const,
      title: story.title,
      subtitle: story.profiles?.full_name,
      snippet: story.content?.substring(0, 150) + '...',
      url: `/stories/${story.id}`,
      metadata: {
        date: story.occurred_on,
        people: story.person_story_links?.map((link: any) => link.people?.full_name).filter(Boolean) || [],
        tags: story.tags || []
      },
      score: this.calculateStoryScore(story, terms)
    }))
  }

  private static async searchRecipes(terms: string[], filters: SearchFilters, familyId: string): Promise<SearchResult[]> {
    if (filters.type && !filters.type.includes('recipe')) return []

    let query = supabase
      .from('recipes')
      .select('*')
      .eq('family_id', familyId)

    if (terms.length > 0) {
      const searchTerm = terms.join(' ')
      query = query.or(`title.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
    }

    const { data: recipes } = await query.limit(10)

    return (recipes || []).map(recipe => ({
      id: recipe.id,
      type: 'recipe' as const,
      title: recipe.title,
      subtitle: `Recipe`,
      snippet: recipe.notes?.substring(0, 100),
      url: `/recipes/${recipe.id}`,
      metadata: {
        tags: recipe.dietary_tags || []
      },
      score: this.calculateRecipeScore(recipe, terms)
    }))
  }

  private static async searchProperties(terms: string[], filters: SearchFilters, familyId: string): Promise<SearchResult[]> {
    if (filters.type && !filters.type.includes('property')) return []

    let query = supabase
      .from('properties')
      .select('*')
      .eq('family_id', familyId)

    if (terms.length > 0) {
      const searchTerm = terms.join(' ')
      query = query.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }

    const { data: properties } = await query.limit(10)

    return (properties || []).map(property => ({
      id: property.id,
      type: 'property' as const,
      title: property.name,
      subtitle: property.address,
      snippet: property.description?.substring(0, 100),
      url: `/properties/${property.id}`,
      metadata: {
        tags: property.tags || []
      },
      score: this.calculatePropertyScore(property, terms)
    }))
  }

  private static async searchPets(terms: string[], filters: SearchFilters, familyId: string): Promise<SearchResult[]> {
    if (filters.type && !filters.type.includes('pet')) return []

    let query = supabase
      .from('pets')
      .select('*')
      .eq('family_id', familyId)

    if (terms.length > 0) {
      const searchTerm = terms.join(' ')
      query = query.or(`name.ilike.%${searchTerm}%,breed.ilike.%${searchTerm}%,species.ilike.%${searchTerm}%`)
    }

    const { data: pets } = await query.limit(10)

    return (pets || []).map(pet => ({
      id: pet.id,
      type: 'pet' as const,
      title: pet.name,
      subtitle: `${pet.species}${pet.breed ? ` • ${pet.breed}` : ''}`,
      url: `/pets/${pet.id}`,
      image: pet.cover_url,
      metadata: {
        tags: pet.tags || []
      },
      score: this.calculatePetScore(pet, terms)
    }))
  }

  static async getSuggestions(query: string, familyId: string): Promise<SearchSuggestion[]> {
    if (query.length < 2) return []

    const suggestions: SearchSuggestion[] = []
    
    // Quick searches for people and places
    const [people, properties] = await Promise.all([
      supabase
        .from('people')
        .select('id, full_name, avatar_url, birth_year, death_year')
        .eq('family_id', familyId)
        .ilike('full_name', `%${query}%`)
        .limit(5), // Increased limit to show more people
      supabase
        .from('properties')
        .select('id, name, address')
        .eq('family_id', familyId)
        .ilike('name', `%${query}%`)
        .limit(2)
    ])

    // Add people suggestions with more context
    people.data?.forEach(person => {
      let subtitle = ''
      if (person.birth_year && person.death_year) {
        subtitle = `${person.birth_year} - ${person.death_year}`
      } else if (person.birth_year) {
        subtitle = `Born ${person.birth_year}`
      } else if (person.death_year) {
        subtitle = `Died ${person.death_year}`
      }
      
      suggestions.push({
        id: person.id,
        type: 'person',
        title: person.full_name,
        subtitle,
        url: `/people/${person.id}`,
        icon: 'user'
      })
    })

    // Add place suggestions
    properties.data?.forEach(property => {
      suggestions.push({
        id: property.id,
        type: 'place',
        title: property.name,
        subtitle: property.address,
        url: `/properties/${property.id}`,
        icon: 'map-pin'
      })
    })

    // Add action suggestions if we have room
    if (suggestions.length < 6) {
      suggestions.push({
        id: 'create-story',
        type: 'action',
        title: `Create story: "${query}"`,
        url: `/stories/new?title=${encodeURIComponent(query)}`,
        icon: 'plus'
      })
    }

    return suggestions.slice(0, 8)
  }

  private static async generateSmartAnswer(query: string, terms: string[], familyId: string): Promise<SmartAnswer | undefined> {
    const lowerQuery = query.toLowerCase()

    // Recipe search pattern
    if (lowerQuery.includes('recipe') || terms.some(term => 
      ['chicken', 'beef', 'pasta', 'cake', 'bread', 'soup', 'salad'].includes(term.toLowerCase())
    )) {
      const recipes = await this.searchRecipes(terms, {}, familyId)
      if (recipes.length > 0) {
        return {
          type: 'recipe_list',
          title: `Recipes matching "${query}"`,
          data: recipes.slice(0, 4),
          refinements: [
            { type: 'dietary', label: 'Vegetarian', filter: { tag: ['vegetarian'] } },
            { type: 'dietary', label: 'Gluten-free', filter: { tag: ['gluten-free'] } }
          ]
        }
      }
    }

    // Property occupancy pattern
    if (lowerQuery.includes('who lived') || lowerQuery.includes('lived at')) {
      // This would need property occupancy data
      return {
        type: 'occupancy',
        title: 'People who lived here',
        data: [], // Would fetch occupancy data
        refinements: []
      }
    }

    return undefined
  }

  private static calculatePersonScore(person: any, terms: string[]): number {
    let score = 0
    const fullName = person.full_name.toLowerCase()
    
    terms.forEach(term => {
      const termLower = term.toLowerCase()
      if (fullName.includes(termLower)) {
        score += fullName === termLower ? 100 : 50
      }
    })

    return score
  }

  private static calculateStoryScore(story: any, terms: string[]): number {
    let score = 0
    const title = story.title.toLowerCase()
    const content = story.content?.toLowerCase() || ''
    
    terms.forEach(term => {
      const termLower = term.toLowerCase()
      if (title.includes(termLower)) score += 30
      if (content.includes(termLower)) score += 10
    })

    // Boost recent stories
    if (story.created_at) {
      const daysSinceCreation = (Date.now() - new Date(story.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreation < 30) score += 20
    }

    return score
  }

  private static calculateRecipeScore(recipe: any, terms: string[]): number {
    let score = 0
    const title = recipe.title.toLowerCase()
    
    terms.forEach(term => {
      const termLower = term.toLowerCase()
      if (title.includes(termLower)) score += 40
    })

    return score
  }

  private static calculatePropertyScore(property: any, terms: string[]): number {
    let score = 0
    const name = property.name.toLowerCase()
    const address = property.address?.toLowerCase() || ''
    
    terms.forEach(term => {
      const termLower = term.toLowerCase()
      if (name.includes(termLower)) score += 50
      if (address.includes(termLower)) score += 30
    })

    return score
  }

  private static calculatePetScore(pet: any, terms: string[]): number {
    let score = 0
    const name = pet.name.toLowerCase()
    const breed = pet.breed?.toLowerCase() || ''
    const species = pet.species.toLowerCase()
    
    terms.forEach(term => {
      const termLower = term.toLowerCase()
      if (name.includes(termLower)) score += 60
      if (breed.includes(termLower)) score += 30
      if (species.includes(termLower)) score += 20
    })

    return score
  }
}