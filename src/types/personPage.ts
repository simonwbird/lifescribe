export interface PersonPageTheme {
  id: string
  name: string
  palette: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  font_scale: number
  shape: 'rounded' | 'sharp' | 'soft'
}

export interface PersonPagePermission {
  id: string
  person_id: string
  user_id: string
  role: 'owner' | 'co_curator' | 'steward' | 'contributor' | 'viewer'
  granted_by?: string
}

export interface PersonPageBlock {
  id: string
  person_id: string
  type: BlockType
  content_json: Record<string, any>
  block_order: number
  visibility: 'only_me' | 'inner_circle' | 'family' | 'public'
  is_enabled: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

export type BlockType = 
  | 'bio'
  | 'timeline'
  | 'photos'
  | 'stories'
  | 'favorites'
  | 'relationships'
  | 'achievements'
  | 'milestones'
  | 'quotes'

export interface PersonPageData {
  person: {
    id: string
    full_name: string
    preferred_name?: string
    pronouns?: string
    status: 'living' | 'passed'
    birth_date?: string
    death_date?: string
    avatar_url?: string
    theme_id?: string
    family_id: string
  }
  blocks: PersonPageBlock[]
  permission: PersonPagePermission | null
  theme: PersonPageTheme | null
}

export const BLOCK_LIBRARY: Array<{
  type: BlockType
  label: string
  description: string
  icon: string
  defaultContent: Record<string, any>
}> = [
  {
    type: 'bio',
    label: 'Biography',
    description: 'Life story and background',
    icon: 'User',
    defaultContent: { text: '' }
  },
  {
    type: 'timeline',
    label: 'Timeline',
    description: 'Key life events in chronological order',
    icon: 'Calendar',
    defaultContent: { events: [] }
  },
  {
    type: 'photos',
    label: 'Photos',
    description: 'Photo gallery',
    icon: 'Camera',
    defaultContent: { layout: 'grid' }
  },
  {
    type: 'stories',
    label: 'Stories',
    description: 'Shared memories and stories',
    icon: 'BookOpen',
    defaultContent: { display: 'list' }
  },
  {
    type: 'favorites',
    label: 'Favorites',
    description: 'Favorite things and interests',
    icon: 'Heart',
    defaultContent: { categories: [] }
  },
  {
    type: 'relationships',
    label: 'Relationships',
    description: 'Family connections',
    icon: 'Users',
    defaultContent: { display: 'tree' }
  },
  {
    type: 'achievements',
    label: 'Achievements',
    description: 'Accomplishments and milestones',
    icon: 'Award',
    defaultContent: { items: [] }
  },
  {
    type: 'milestones',
    label: 'Milestones',
    description: 'Important life moments',
    icon: 'Star',
    defaultContent: { events: [] }
  },
  {
    type: 'quotes',
    label: 'Quotes',
    description: 'Memorable sayings',
    icon: 'Quote',
    defaultContent: { quotes: [] }
  }
]