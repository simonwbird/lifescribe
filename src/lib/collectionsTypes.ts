// Unified content types for Collections page

export type ContentType = 'story' | 'recipe' | 'object' | 'property'

export type ContentBase = {
  id: string
  type: ContentType
  title: string
  occurredAt?: string | null // ISO date string, can be partial/approx
  addedAt: string // created_at timestamp
  location?: string | null
  peopleIds: string[]
  tags: string[]
  coverUrl?: string | null
  visibility: 'family' | 'branch' | 'private'
  status: 'draft' | 'published'
  authorId: string
  authorName: string
  familyId: string
}

export type StoryContent = ContentBase & {
  type: 'story'
  fields: {
    content: string
    mediaCount?: number
  }
}

export type RecipeContent = ContentBase & {
  type: 'recipe'
  fields: {
    ingredients?: string[]
    steps?: string[]
    source?: string
    serves?: string
    cookTime?: number
    prepTime?: number
  }
}

export type ObjectContent = ContentBase & {
  type: 'object'
  fields: {
    description?: string
    provenance?: string
    condition?: string
    maker?: string
    yearEstimated?: number
    valueEstimate?: string
  }
}

export type PropertyContent = ContentBase & {
  type: 'property'
  fields: {
    address?: string
    acquiredYear?: number
    soldYear?: number
    description?: string
  }
}

export type Content = StoryContent | RecipeContent | ObjectContent | PropertyContent

export type ContentFilter = {
  search?: string
  types?: ContentType[]
  peopleIds?: string[]
  tags?: string[]
  dateRange?: {
    start?: string
    end?: string
    type: 'occurred' | 'added'
  }
  location?: string
  visibility?: ('family' | 'branch' | 'private')[]
  status?: ('draft' | 'published')[]
}

export type ContentSort = 
  | 'recent' 
  | 'oldest' 
  | 'title-asc' 
  | 'title-desc'
  | 'occurred-desc' 
  | 'occurred-asc'

export type ViewMode = 'grid' | 'list'

export type SavedFilter = {
  id: string
  name: string
  filter: ContentFilter
  sort: ContentSort
  createdAt: string
}

export type ContentCounts = {
  all: number
  stories: number
  recipes: number
  objects: number
  properties: number
}