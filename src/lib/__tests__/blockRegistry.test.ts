import { describe, it, expect } from 'vitest'
import { 
  BLOCK_REGISTRY, 
  getBlockMetadata, 
  isSingletonBlock,
  getSingletonBlocks,
  getBlockAnchorId
} from '../blockRegistry'

describe('blockRegistry', () => {
  describe('BLOCK_REGISTRY', () => {
    it('should have all required blocks', () => {
      const requiredBlocks = [
        'Hero', 'Bio', 'Timeline', 'Stories', 'Photos',
        'QuickFacts', 'TOC', 'MediaCounters'
      ]

      for (const blockId of requiredBlocks) {
        expect(BLOCK_REGISTRY[blockId]).toBeDefined()
      }
    })

    it('should have unique anchor IDs', () => {
      const anchorIds = Object.values(BLOCK_REGISTRY)
        .filter(block => block.anchorId)
        .map(block => block.anchorId)

      const uniqueAnchorIds = new Set(anchorIds)
      expect(anchorIds.length).toBe(uniqueAnchorIds.size)
    })

    it('should mark widget blocks as singletons', () => {
      const widgetSingletons = [
        'QuickFacts',
        'TOC',
        'ContributeCTA',
        'Anniversaries',
        'VisibilitySearch',
        'MiniMap',
        'MediaCounters',
        'FavoritesQuirks',
        'Causes',
        'ShareExport',
        'PinnedHighlights'
      ]

      for (const blockId of widgetSingletons) {
        const metadata = BLOCK_REGISTRY[blockId]
        expect(metadata?.singleton).toBe(true)
      }
    })

    it('should not mark content blocks as singletons', () => {
      const contentBlocks = [
        'Hero',
        'Bio',
        'Timeline',
        'Stories',
        'Photos',
        'Audio',
        'Relationships',
        'Guestbook'
      ]

      for (const blockId of contentBlocks) {
        const metadata = BLOCK_REGISTRY[blockId]
        expect(metadata?.singleton).toBe(false)
      }
    })

    it('should have ARIA labels for all blocks', () => {
      for (const [blockId, metadata] of Object.entries(BLOCK_REGISTRY)) {
        expect(metadata.ariaLabel).toBeDefined()
        expect(metadata.ariaLabel).toBeTruthy()
      }
    })

    it('should have anchor IDs for all blocks', () => {
      for (const [blockId, metadata] of Object.entries(BLOCK_REGISTRY)) {
        expect(metadata.anchorId).toBeDefined()
        expect(metadata.anchorId).toBeTruthy()
      }
    })
  })

  describe('getBlockMetadata', () => {
    it('should return metadata for valid block', () => {
      const metadata = getBlockMetadata('QuickFacts')
      expect(metadata).toBeDefined()
      expect(metadata?.displayName).toBe('Quick Facts')
      expect(metadata?.singleton).toBe(true)
    })

    it('should return undefined for invalid block', () => {
      const metadata = getBlockMetadata('InvalidBlock')
      expect(metadata).toBeUndefined()
    })
  })

  describe('isSingletonBlock', () => {
    it('should return true for singleton blocks', () => {
      expect(isSingletonBlock('QuickFacts')).toBe(true)
      expect(isSingletonBlock('TOC')).toBe(true)
      expect(isSingletonBlock('MediaCounters')).toBe(true)
    })

    it('should return false for non-singleton blocks', () => {
      expect(isSingletonBlock('Hero')).toBe(false)
      expect(isSingletonBlock('Bio')).toBe(false)
      expect(isSingletonBlock('Timeline')).toBe(false)
    })

    it('should return false for unknown blocks', () => {
      expect(isSingletonBlock('UnknownBlock')).toBe(false)
    })
  })

  describe('getSingletonBlocks', () => {
    it('should return all singleton block IDs', () => {
      const singletons = getSingletonBlocks()
      
      expect(singletons).toContain('QuickFacts')
      expect(singletons).toContain('TOC')
      expect(singletons).toContain('MediaCounters')
      
      expect(singletons).not.toContain('Hero')
      expect(singletons).not.toContain('Bio')
    })

    it('should return at least 10 singleton blocks', () => {
      const singletons = getSingletonBlocks()
      expect(singletons.length).toBeGreaterThanOrEqual(10)
    })
  })

  describe('getBlockAnchorId', () => {
    it('should return anchor ID for registered block', () => {
      expect(getBlockAnchorId('Bio')).toBe('bio')
      expect(getBlockAnchorId('QuickFacts')).toBe('quick-facts')
      expect(getBlockAnchorId('Timeline')).toBe('timeline')
    })

    it('should generate anchor ID for unknown block', () => {
      const anchorId = getBlockAnchorId('MyCustomBlock')
      expect(anchorId).toBe('mycustomblock')
    })

    it('should handle blocks with spaces', () => {
      const anchorId = getBlockAnchorId('My Custom Block')
      expect(anchorId).toBe('my-custom-block')
    })
  })

  describe('Anchor ID conventions', () => {
    it('should use kebab-case for multi-word anchors', () => {
      expect(BLOCK_REGISTRY.QuickFacts.anchorId).toBe('quick-facts')
      expect(BLOCK_REGISTRY.PinnedHighlights.anchorId).toBe('highlights')
      expect(BLOCK_REGISTRY.VisibilitySearch.anchorId).toBe('visibility-search')
    })

    it('should be lowercase', () => {
      for (const metadata of Object.values(BLOCK_REGISTRY)) {
        expect(metadata.anchorId).toBe(metadata.anchorId?.toLowerCase())
      }
    })

    it('should not contain special characters except hyphens', () => {
      for (const metadata of Object.values(BLOCK_REGISTRY)) {
        expect(metadata.anchorId).toMatch(/^[a-z0-9-]+$/)
      }
    })
  })
})
