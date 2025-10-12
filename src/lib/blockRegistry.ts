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
}

export const BLOCK_REGISTRY: Record<string, BlockMetadata> = {
  // Content blocks (not singletons)
  Hero: {
    id: 'Hero',
    type: 'hero',
    singleton: false,
    displayName: 'Hero',
    category: 'content'
  },
  Bio: {
    id: 'Bio',
    type: 'bio',
    singleton: false,
    displayName: 'Biography',
    category: 'content'
  },
  Timeline: {
    id: 'Timeline',
    type: 'timeline',
    singleton: false,
    displayName: 'Timeline',
    category: 'content'
  },
  Stories: {
    id: 'Stories',
    type: 'stories',
    singleton: false,
    displayName: 'Stories',
    category: 'content'
  },
  Photos: {
    id: 'Photos',
    type: 'photos',
    singleton: false,
    displayName: 'Photos',
    category: 'content'
  },
  Audio: {
    id: 'Audio',
    type: 'audio',
    singleton: false,
    displayName: 'Audio',
    category: 'content'
  },
  Relationships: {
    id: 'Relationships',
    type: 'relationships',
    singleton: false,
    displayName: 'Relationships',
    category: 'content'
  },
  Guestbook: {
    id: 'Guestbook',
    type: 'guestbook',
    singleton: false,
    displayName: 'Guestbook',
    category: 'content'
  },
  Services: {
    id: 'Services',
    type: 'services',
    singleton: false,
    displayName: 'Services',
    category: 'content'
  },
  Places: {
    id: 'Places',
    type: 'places',
    singleton: false,
    displayName: 'Places',
    category: 'content'
  },

  // Widget blocks (singletons)
  QuickFacts: {
    id: 'QuickFacts',
    type: 'quick_facts',
    singleton: true,
    displayName: 'Quick Facts',
    category: 'widget'
  },
  PinnedHighlights: {
    id: 'PinnedHighlights',
    type: 'pinned_highlights',
    singleton: true,
    displayName: 'Pinned Highlights',
    category: 'widget'
  },
  TOC: {
    id: 'TOC',
    type: 'toc',
    singleton: true,
    displayName: 'Table of Contents',
    category: 'navigation'
  },
  ContributeCTA: {
    id: 'ContributeCTA',
    type: 'contribute_cta',
    singleton: true,
    displayName: 'Contribute CTA',
    category: 'widget'
  },
  Anniversaries: {
    id: 'Anniversaries',
    type: 'anniversaries',
    singleton: true,
    displayName: 'Anniversaries',
    category: 'widget'
  },
  VisibilitySearch: {
    id: 'VisibilitySearch',
    type: 'visibility_search',
    singleton: true,
    displayName: 'Visibility & Search',
    category: 'widget'
  },
  MiniMap: {
    id: 'MiniMap',
    type: 'mini_map',
    singleton: true,
    displayName: 'Mini Map',
    category: 'widget'
  },
  MediaCounters: {
    id: 'MediaCounters',
    type: 'media_counters',
    singleton: true,
    displayName: 'Media Counters',
    category: 'widget'
  },
  FavoritesQuirks: {
    id: 'FavoritesQuirks',
    type: 'favorites_quirks',
    singleton: true,
    displayName: 'Favorites & Quirks',
    category: 'widget'
  },
  Causes: {
    id: 'Causes',
    type: 'causes',
    singleton: true,
    displayName: 'Causes',
    category: 'widget'
  },
  ShareExport: {
    id: 'ShareExport',
    type: 'share_export',
    singleton: true,
    displayName: 'Share & Export',
    category: 'widget'
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

    // Check if it's a singleton and already rendered
    if (metadata.singleton && this.renderedBlocks.has(blockId)) {
      console.error(
        `[BlockRegistry] Singleton violation: Block "${metadata.displayName}" (${blockId}) cannot be rendered more than once. Second instance will be dropped.`,
        {
          blockId,
          metadata,
          existingInstances: Array.from(this.renderedBlocks)
        }
      )
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
