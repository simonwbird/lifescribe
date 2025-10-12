/**
 * Block Registry with Singleton Enforcement
 * Prevents duplicate blocks from being rendered by design
 */

export interface BlockMetadata {
  id: string
  type: string
  singleton: boolean
  displayName: string
  category: 'content' | 'widget' | 'navigation'
  anchorId?: string // Stable anchor ID for jump links
  ariaLabel?: string // Screen reader label
}

export const BLOCK_REGISTRY: Record<string, BlockMetadata> = {
  // Content blocks (not singletons)
  Hero: {
    id: 'Hero',
    type: 'hero',
    singleton: false,
    displayName: 'Hero',
    category: 'content',
    anchorId: 'hero',
    ariaLabel: 'Hero section'
  },
  Bio: {
    id: 'Bio',
    type: 'bio',
    singleton: false,
    displayName: 'Biography',
    category: 'content',
    anchorId: 'bio',
    ariaLabel: 'Biography section'
  },
  Timeline: {
    id: 'Timeline',
    type: 'timeline',
    singleton: false,
    displayName: 'Timeline',
    category: 'content',
    anchorId: 'timeline',
    ariaLabel: 'Life timeline'
  },
  Stories: {
    id: 'Stories',
    type: 'stories',
    singleton: false,
    displayName: 'Stories',
    category: 'content',
    anchorId: 'stories',
    ariaLabel: 'Stories and memories'
  },
  Photos: {
    id: 'Photos',
    type: 'photos',
    singleton: false,
    displayName: 'Photos',
    category: 'content',
    anchorId: 'photos',
    ariaLabel: 'Photo gallery'
  },
  Audio: {
    id: 'Audio',
    type: 'audio',
    singleton: false,
    displayName: 'Audio',
    category: 'content',
    anchorId: 'audio',
    ariaLabel: 'Audio recordings'
  },
  Relationships: {
    id: 'Relationships',
    type: 'relationships',
    singleton: false,
    displayName: 'Relationships',
    category: 'content',
    anchorId: 'relationships',
    ariaLabel: 'Family relationships'
  },
  Guestbook: {
    id: 'Guestbook',
    type: 'guestbook',
    singleton: false,
    displayName: 'Guestbook',
    category: 'content',
    anchorId: 'guestbook',
    ariaLabel: 'Guestbook messages'
  },
  Services: {
    id: 'Services',
    type: 'services',
    singleton: false,
    displayName: 'Services',
    category: 'content',
    anchorId: 'services',
    ariaLabel: 'Service events'
  },
  Places: {
    id: 'Places',
    type: 'places',
    singleton: false,
    displayName: 'Places',
    category: 'content',
    anchorId: 'places',
    ariaLabel: 'Significant places'
  },

  // Widget blocks (singletons)
  QuickFacts: {
    id: 'QuickFacts',
    type: 'quick_facts',
    singleton: true,
    displayName: 'Quick Facts',
    category: 'widget',
    anchorId: 'quick-facts',
    ariaLabel: 'Quick facts sidebar'
  },
  PinnedHighlights: {
    id: 'PinnedHighlights',
    type: 'pinned_highlights',
    singleton: true,
    displayName: 'Pinned Highlights',
    category: 'widget',
    anchorId: 'highlights',
    ariaLabel: 'Pinned highlights'
  },
  TOC: {
    id: 'TOC',
    type: 'toc',
    singleton: true,
    displayName: 'Table of Contents',
    category: 'navigation',
    anchorId: 'toc',
    ariaLabel: 'Table of contents navigation'
  },
  ContributeCTA: {
    id: 'ContributeCTA',
    type: 'contribute_cta',
    singleton: true,
    displayName: 'Contribute CTA',
    category: 'widget',
    anchorId: 'contribute',
    ariaLabel: 'Contribute call to action'
  },
  Anniversaries: {
    id: 'Anniversaries',
    type: 'anniversaries',
    singleton: true,
    displayName: 'Anniversaries',
    category: 'widget',
    anchorId: 'anniversaries',
    ariaLabel: 'Upcoming anniversaries'
  },
  VisibilitySearch: {
    id: 'VisibilitySearch',
    type: 'visibility_search',
    singleton: true,
    displayName: 'Visibility & Search',
    category: 'widget',
    anchorId: 'visibility-search',
    ariaLabel: 'Visibility and search settings'
  },
  MiniMap: {
    id: 'MiniMap',
    type: 'mini_map',
    singleton: true,
    displayName: 'Mini Map',
    category: 'widget',
    anchorId: 'map',
    ariaLabel: 'Location mini map'
  },
  MediaCounters: {
    id: 'MediaCounters',
    type: 'media_counters',
    singleton: true,
    displayName: 'Media Counters',
    category: 'widget',
    anchorId: 'media-counters',
    ariaLabel: 'Media statistics'
  },
  FavoritesQuirks: {
    id: 'FavoritesQuirks',
    type: 'favorites_quirks',
    singleton: true,
    displayName: 'Favorites & Quirks',
    category: 'widget',
    anchorId: 'favorites',
    ariaLabel: 'Favorites and quirks'
  },
  Causes: {
    id: 'Causes',
    type: 'causes',
    singleton: true,
    displayName: 'Causes',
    category: 'widget',
    anchorId: 'causes',
    ariaLabel: 'Supported causes'
  },
  ShareExport: {
    id: 'ShareExport',
    type: 'share_export',
    singleton: true,
    displayName: 'Share & Export',
    category: 'widget',
    anchorId: 'share',
    ariaLabel: 'Share and export options'
  }
}

/**
 * BlockValidator enforces singleton rules at runtime
 */
export class BlockValidator {
  private renderedBlocks: Set<string> = new Set()

  /**
   * Check if a block can be rendered
   * @returns true if block can render, false if it's a duplicate singleton
   */
  canRender(blockId: string): boolean {
    const metadata = BLOCK_REGISTRY[blockId]
    
    if (!metadata) {
      console.warn(`[BlockRegistry] Unknown block ID: ${blockId}`)
      return true // Allow unknown blocks
    }

    if (metadata.singleton && this.renderedBlocks.has(blockId)) {
      // Defer logging to avoid React "setState during render" warnings from log collectors
      setTimeout(() => {
        try {
          // eslint-disable-next-line no-console
          console.warn(
            `[BlockRegistry] Singleton violation: Block "${metadata.displayName}" (${blockId}) cannot be rendered more than once. Second instance will be dropped.`,
            {
              blockId,
              metadata,
              existingInstances: Array.from(this.renderedBlocks)
            }
          )
        } catch {}
      }, 0)
      return false
    }

    return true
  }

  /**
   * Register a block as rendered
   */
  registerBlock(blockId: string): void {
    const metadata = BLOCK_REGISTRY[blockId]
    
    if (metadata?.singleton) {
      this.renderedBlocks.add(blockId)
    }
  }

  /**
   * Clear all registered blocks (useful for re-renders)
   */
  reset(): void {
    this.renderedBlocks.clear()
  }

  /**
   * Get all currently rendered singleton blocks
   */
  getRenderedSingletons(): string[] {
    return Array.from(this.renderedBlocks)
  }
}

/**
 * Get block metadata by ID
 */
export function getBlockMetadata(blockId: string): BlockMetadata | undefined {
  return BLOCK_REGISTRY[blockId]
}

/**
 * Check if a block is a singleton
 */
export function isSingletonBlock(blockId: string): boolean {
  return BLOCK_REGISTRY[blockId]?.singleton ?? false
}

/**
 * Get all singleton block IDs
 */
export function getSingletonBlocks(): string[] {
  return Object.keys(BLOCK_REGISTRY).filter(key => BLOCK_REGISTRY[key].singleton)
}

/**
 * Get anchor ID for a block (for jump links and TOC)
 */
export function getBlockAnchorId(blockId: string): string {
  const metadata = BLOCK_REGISTRY[blockId]
  return metadata?.anchorId || blockId.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Get all content blocks in logical reading order
 */
export function getContentBlocksInOrder(): BlockMetadata[] {
  const contentOrder = [
    'Hero', 'Bio', 'Timeline', 'Stories', 
    'Photos', 'Audio', 'Relationships', 'Guestbook',
    'Services', 'Places'
  ]
  
  return contentOrder
    .map(id => BLOCK_REGISTRY[id])
    .filter((block): block is BlockMetadata => block !== undefined && block.category === 'content')
}

/**
 * Get all widget blocks
 */
export function getWidgetBlocks(): BlockMetadata[] {
  return Object.values(BLOCK_REGISTRY)
    .filter(block => block.category === 'widget' || block.category === 'navigation')
}
