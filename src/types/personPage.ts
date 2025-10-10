export interface PersonPageTheme {
  id: string
  name: string
  palette: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
  }
  font_scale: number
  shape: 'rounded' | 'sharp' | 'soft'
  layout: 'magazine' | 'linear' | 'card_stack'
  high_contrast_mode: boolean
  custom_css?: Record<string, any>
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
  // Life preset blocks
  | 'hero'
  | 'timeline'
  | 'story_roll'
  | 'people_web'
  | 'objects_places'
  | 'now_next'
  | 'guestbook_live'
  // Tribute preset blocks
  | 'hero_memorial'
  | 'life_arc_timeline'
  | 'story_collage'
  | 'audio_remembrances'
  | 'gallery'
  | 'relationships'
  | 'guestbook_tribute'
  | 'service_events'
  // Generic/shared blocks
  | 'bio'
  | 'photos'
  | 'stories'
  | 'favorites'
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

export interface PresetConfig {
  preset: 'life' | 'tribute'
  name: string
  description: string
  defaultBlocks: Array<{
    type: BlockType
    order: number
    visibility: PersonPageBlock['visibility']
    label: string
  }>
  theme: {
    primary: string
    secondary: string
    accent: string
    mood: string
  }
}

export const BLOCK_LIBRARY: Array<{
  type: BlockType
  label: string
  description: string
  icon: string
  defaultContent: Record<string, any>
  presets: ('life' | 'tribute' | 'both')[]
}> = [
  // Life preset blocks
  {
    type: 'hero',
    label: 'Hero Section',
    description: 'Featured introduction and photo',
    icon: 'Star',
    defaultContent: { layout: 'full' },
    presets: ['life']
  },
  {
    type: 'story_roll',
    label: 'Story Roll',
    description: 'Latest stories and updates',
    icon: 'BookOpen',
    defaultContent: { display: 'cards', limit: 10 },
    presets: ['life']
  },
  {
    type: 'people_web',
    label: 'Family Connections',
    description: 'Interactive relationship map',
    icon: 'Users',
    defaultContent: { display: 'web' },
    presets: ['life']
  },
  {
    type: 'objects_places',
    label: 'Favorite Places & Things',
    description: 'Special locations and cherished objects',
    icon: 'MapPin',
    defaultContent: { items: [] },
    presets: ['life']
  },
  {
    type: 'now_next',
    label: 'Now & Next',
    description: 'Current activities and upcoming plans',
    icon: 'Calendar',
    defaultContent: { now: '', next: [] },
    presets: ['life']
  },
  {
    type: 'guestbook_live',
    label: 'Guestbook',
    description: 'Messages and well-wishes',
    icon: 'MessageSquare',
    defaultContent: { entries: [] },
    presets: ['life']
  },
  // Tribute preset blocks
  {
    type: 'hero_memorial',
    label: 'Memorial Hero',
    description: 'Memorial introduction with dates',
    icon: 'Heart',
    defaultContent: { layout: 'memorial' },
    presets: ['tribute']
  },
  {
    type: 'life_arc_timeline',
    label: 'Life Arc',
    description: 'Complete life journey timeline',
    icon: 'TrendingUp',
    defaultContent: { style: 'arc', events: [] },
    presets: ['tribute']
  },
  {
    type: 'story_collage',
    label: 'Memory Collage',
    description: 'Stories arranged in visual collage',
    icon: 'Grid',
    defaultContent: { layout: 'masonry' },
    presets: ['tribute']
  },
  {
    type: 'audio_remembrances',
    label: 'Audio Remembrances',
    description: 'Recorded memories and messages',
    icon: 'Mic',
    defaultContent: { recordings: [] },
    presets: ['tribute']
  },
  {
    type: 'gallery',
    label: 'Photo Gallery',
    description: 'Curated photo collection',
    icon: 'Camera',
    defaultContent: { layout: 'gallery' },
    presets: ['tribute']
  },
  {
    type: 'guestbook_tribute',
    label: 'Tribute Messages',
    description: 'Condolences and remembrances',
    icon: 'MessageCircle',
    defaultContent: { entries: [] },
    presets: ['tribute']
  },
  {
    type: 'service_events',
    label: 'Service & Events',
    description: 'Memorial service details',
    icon: 'Calendar',
    defaultContent: { events: [] },
    presets: ['tribute']
  },
  // Shared blocks (both presets)
  {
    type: 'bio',
    label: 'Biography',
    description: 'Life story and background',
    icon: 'User',
    defaultContent: { text: '' },
    presets: ['both']
  },
  {
    type: 'timeline',
    label: 'Timeline',
    description: 'Key life events',
    icon: 'Clock',
    defaultContent: { events: [] },
    presets: ['both']
  },
  {
    type: 'photos',
    label: 'Photos',
    description: 'Photo collection',
    icon: 'Image',
    defaultContent: { layout: 'grid' },
    presets: ['both']
  },
  {
    type: 'stories',
    label: 'Stories',
    description: 'Shared memories',
    icon: 'Book',
    defaultContent: { display: 'list' },
    presets: ['both']
  },
  {
    type: 'favorites',
    label: 'Favorites',
    description: 'Favorite things and interests',
    icon: 'Heart',
    defaultContent: { categories: [] },
    presets: ['both']
  },
  {
    type: 'relationships',
    label: 'Relationships',
    description: 'Family connections',
    icon: 'Users',
    defaultContent: { display: 'tree' },
    presets: ['both']
  },
  {
    type: 'achievements',
    label: 'Achievements',
    description: 'Accomplishments',
    icon: 'Award',
    defaultContent: { items: [] },
    presets: ['both']
  },
  {
    type: 'milestones',
    label: 'Milestones',
    description: 'Important moments',
    icon: 'Flag',
    defaultContent: { events: [] },
    presets: ['both']
  },
  {
    type: 'quotes',
    label: 'Quotes',
    description: 'Memorable sayings',
    icon: 'Quote',
    defaultContent: { quotes: [] },
    presets: ['both']
  }
]