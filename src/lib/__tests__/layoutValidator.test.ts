import { describe, it, expect } from 'vitest'
import { validateLayoutMap, validateLayout, validateBlocksExist } from '../layoutValidator'
import { LayoutMap } from '@/components/person-page/PortalLayoutManager'

describe('layoutValidator', () => {
  describe('validateLayoutMap', () => {
    it('should pass for valid layout with no duplicates', () => {
      const validLayout: LayoutMap = {
        desktop: {
          main: ['Hero', 'Bio', 'Timeline'],
          rail: ['QuickFacts', 'TOC']
        },
        tablet: {
          main: ['Hero', 'Bio', 'Timeline'],
          rail: ['QuickFacts']
        },
        mobile: {
          main: ['Hero', 'Bio', 'QuickFacts', 'Timeline'],
          rail: []
        }
      }

      const result = validateLayoutMap(validLayout)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when block appears in both main and rail', () => {
      const invalidLayout: LayoutMap = {
        desktop: {
          main: ['Hero', 'Bio', 'QuickFacts'],
          rail: ['QuickFacts', 'TOC']  // QuickFacts duplicated
        },
        tablet: {
          main: ['Hero', 'Bio'],
          rail: ['QuickFacts']
        },
        mobile: {
          main: ['Hero', 'Bio', 'QuickFacts'],
          rail: []
        }
      }

      const result = validateLayoutMap(invalidLayout)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('duplicate')
      expect(result.errors[0].blockId).toBe('QuickFacts')
      expect(result.errors[0].breakpoint).toBe('desktop')
    })

    it('should fail when singleton block appears multiple times', () => {
      const invalidLayout: LayoutMap = {
        desktop: {
          main: ['Hero', 'QuickFacts'],
          rail: ['QuickFacts']  // Singleton duplicated
        },
        tablet: {
          main: ['Hero'],
          rail: ['QuickFacts']
        },
        mobile: {
          main: ['Hero', 'QuickFacts'],
          rail: []
        }
      }

      const result = validateLayoutMap(invalidLayout)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].type).toBe('duplicate')
      expect(result.errors[0].blockId).toBe('QuickFacts')
    })

    it('should detect multiple violations across breakpoints', () => {
      const invalidLayout: LayoutMap = {
        desktop: {
          main: ['Hero', 'Bio', 'QuickFacts'],
          rail: ['QuickFacts', 'TOC']  // Duplicate
        },
        tablet: {
          main: ['Hero', 'Bio', 'TOC'],
          rail: ['TOC', 'QuickFacts']  // Duplicate TOC
        },
        mobile: {
          main: ['Hero', 'Bio'],
          rail: []
        }
      }

      const result = validateLayoutMap(invalidLayout)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
      
      const desktopErrors = result.errors.filter(e => e.breakpoint === 'desktop')
      const tabletErrors = result.errors.filter(e => e.breakpoint === 'tablet')
      
      expect(desktopErrors).toHaveLength(1)
      expect(tabletErrors).toHaveLength(1)
    })

    it('should warn about unknown block IDs', () => {
      const layoutWithUnknown: LayoutMap = {
        desktop: {
          main: ['Hero', 'UnknownBlock'],
          rail: ['QuickFacts']
        },
        tablet: {
          main: ['Hero'],
          rail: ['QuickFacts']
        },
        mobile: {
          main: ['Hero', 'QuickFacts'],
          rail: []
        }
      }

      const result = validateLayoutMap(layoutWithUnknown)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('UnknownBlock')
    })
  })

  describe('validateBlocksExist', () => {
    it('should pass for valid block IDs', () => {
      const blocks = ['Hero', 'Bio', 'QuickFacts', 'Timeline']
      const result = validateBlocksExist(blocks)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail for invalid block IDs', () => {
      const blocks = ['Hero', 'InvalidBlock', 'Bio']
      const result = validateBlocksExist(blocks)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].blockId).toBe('InvalidBlock')
    })
  })

  describe('validateLayout', () => {
    it('should validate structure and content', () => {
      const validLayout: LayoutMap = {
        desktop: {
          main: ['Hero', 'Bio'],
          rail: ['QuickFacts']
        },
        tablet: {
          main: ['Hero', 'Bio'],
          rail: ['QuickFacts']
        },
        mobile: {
          main: ['Hero', 'Bio', 'QuickFacts'],
          rail: []
        }
      }

      const result = validateLayout(validLayout)
      expect(result.valid).toBe(true)
    })

    it('should fail for missing breakpoint', () => {
      const invalidLayout: any = {
        desktop: {
          main: ['Hero'],
          rail: []
        }
        // Missing tablet and mobile
      }

      const result = validateLayout(invalidLayout)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })

    it('should fail for invalid structure', () => {
      const invalidLayout: any = {
        desktop: {
          main: 'not-an-array',  // Should be array
          rail: []
        },
        tablet: {
          main: [],
          rail: []
        },
        mobile: {
          main: [],
          rail: []
        }
      }

      const result = validateLayout(invalidLayout)
      expect(result.valid).toBe(false)
    })
  })

  describe('Real-world scenarios', () => {
    it('should allow same block at different breakpoints (not a duplicate)', () => {
      const layout: LayoutMap = {
        desktop: {
          main: ['Hero', 'Bio'],
          rail: ['QuickFacts']  // QuickFacts in rail
        },
        tablet: {
          main: ['Hero', 'Bio'],
          rail: ['QuickFacts']  // Same placement, OK
        },
        mobile: {
          main: ['Hero', 'Bio', 'QuickFacts'],  // Moved to main, OK
          rail: []
        }
      }

      const result = validateLayoutMap(layout)
      expect(result.valid).toBe(true)
    })

    it('should enforce singleton rule for QuickFacts', () => {
      const layout: LayoutMap = {
        desktop: {
          main: ['Hero', 'Bio', 'QuickFacts'],
          rail: ['QuickFacts']  // INVALID: singleton in both
        },
        tablet: {
          main: ['Hero', 'Bio'],
          rail: ['QuickFacts']
        },
        mobile: {
          main: ['Hero', 'Bio', 'QuickFacts'],
          rail: []
        }
      }

      const result = validateLayoutMap(layout)
      expect(result.valid).toBe(false)
      expect(result.errors[0].type).toBe('duplicate')
      expect(result.errors[0].blockId).toBe('QuickFacts')
    })

    it('should enforce singleton rule for TOC', () => {
      const layout: LayoutMap = {
        desktop: {
          main: ['Hero', 'TOC'],
          rail: ['TOC', 'QuickFacts']  // INVALID: TOC in both
        },
        tablet: {
          main: ['Hero'],
          rail: ['TOC']
        },
        mobile: {
          main: ['Hero', 'TOC'],
          rail: []
        }
      }

      const result = validateLayoutMap(layout)
      expect(result.valid).toBe(false)
      expect(result.errors[0].blockId).toBe('TOC')
    })
  })
})
