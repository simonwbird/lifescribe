import { LayoutMap } from '@/components/person-page/PortalLayoutManager'

export const DEFAULT_LAYOUT_MAP: LayoutMap = {
  desktop: {
    main: [
      'Hero',
      'Bio',
      'Timeline',
      'Stories',
      'Photos',
      'Audio',
      'Relationships',
      'Guestbook'
    ],
    rail: [
      'QuickFacts',
      'PinnedHighlights',
      'TOC',
      'ContributeCTA',
      'Anniversaries',
      'VisibilitySearch',
      'MiniMap',
      'MediaCounters',
      'FavoritesQuirks',
      'Causes',
      'ShareExport'
    ]
  },
  tablet: {
    main: [
      'Hero',
      'Bio',
      'Timeline',
      'Stories',
      'Photos',
      'Audio',
      'Relationships',
      'Guestbook'
    ],
    rail: [
      'QuickFacts',
      'PinnedHighlights',
      'TOC',
      'ContributeCTA',
      'Anniversaries',
      'VisibilitySearch',
      'MediaCounters'
    ]
  },
  mobile: {
    main: [
      'Hero',
      'Bio',
      'QuickFacts',
      'PinnedHighlights',
      'TOC',
      'ContributeCTA',
      'Anniversaries',
      'VisibilitySearch',
      'MiniMap',
      'MediaCounters',
      'FavoritesQuirks',
      'Causes',
      'ShareExport',
      'Timeline',
      'Stories',
      'Photos',
      'Audio',
      'Relationships',
      'Guestbook'
    ],
    rail: []
  }
}

// Helper to map block types to layout IDs
export function getBlockLayoutId(blockType: string): string {
  const typeMap: Record<string, string> = {
    // Hero blocks
    'hero': 'Hero',
    'hero_memorial': 'Hero',
    
    // Bio blocks
    'bio': 'Bio',
    'bio_overview': 'Bio',
    
    // Timeline blocks
    'timeline': 'Timeline',
    'life_arc_timeline': 'Timeline',
    
    // Story blocks
    'story_roll': 'Stories',
    'story_collage': 'Stories',
    'stories': 'Stories',
    
    // Photo blocks
    'photos': 'Photos',
    'gallery': 'Photos',
    
    // Audio blocks
    'audio_remembrances': 'Audio',
    
    // Relationship blocks
    'people_web': 'Relationships',
    'relationships': 'Relationships',
    
    // Guestbook blocks
    'guestbook_live': 'Guestbook',
    'guestbook_tribute': 'Guestbook',
    
    // Service blocks
    'service_events': 'Services',
    
    // Places blocks
    'objects_places': 'Places'
  }
  
  return typeMap[blockType] || blockType
}
