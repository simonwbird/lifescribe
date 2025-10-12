import { LayoutMap } from '@/components/person-page/PortalLayoutManager'
import { BLOCK_REGISTRY, getBlockMetadata, isSingletonBlock } from './blockRegistry'

export interface ValidationError {
  type: 'duplicate' | 'singleton_violation' | 'missing_anchor' | 'invalid_block'
  breakpoint: string
  blockId: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
}

/**
 * Validates a layout map for duplicates, singleton violations, and other issues
 */
export function validateLayoutMap(layoutMap: LayoutMap): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Validate each breakpoint
  for (const [breakpoint, layout] of Object.entries(layoutMap)) {
    const { main, rail } = layout

    // Check for duplicates across main and rail
    const allBlocks = [...main, ...rail]
    const seen = new Set<string>()
    const duplicates = new Set<string>()

    for (const blockId of allBlocks) {
      if (seen.has(blockId)) {
        duplicates.add(blockId)
      }
      seen.add(blockId)
    }

    // Report duplicates
    for (const blockId of duplicates) {
      errors.push({
        type: 'duplicate',
        breakpoint,
        blockId,
        message: `Block "${blockId}" appears in both main and rail at ${breakpoint} breakpoint`
      })
    }

    // Validate singleton blocks
    const singletonCounts = new Map<string, number>()
    
    for (const blockId of allBlocks) {
      if (isSingletonBlock(blockId)) {
        singletonCounts.set(blockId, (singletonCounts.get(blockId) || 0) + 1)
      }
    }

    for (const [blockId, count] of singletonCounts.entries()) {
      if (count > 1) {
        errors.push({
          type: 'singleton_violation',
          breakpoint,
          blockId,
          message: `Singleton block "${blockId}" appears ${count} times at ${breakpoint} breakpoint`
        })
      }
    }

    // Check for invalid block IDs
    for (const blockId of allBlocks) {
      const metadata = getBlockMetadata(blockId)
      if (!metadata) {
        warnings.push(`Unknown block ID "${blockId}" at ${breakpoint} breakpoint`)
      }
    }

    // Check for missing anchors
    for (const blockId of allBlocks) {
      const metadata = getBlockMetadata(blockId)
      if (metadata && !metadata.anchorId) {
        warnings.push(`Block "${blockId}" missing anchorId at ${breakpoint} breakpoint`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates that all blocks in a layout map are registered
 */
export function validateBlocksExist(blocks: string[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  for (const blockId of blocks) {
    if (!BLOCK_REGISTRY[blockId]) {
      errors.push({
        type: 'invalid_block',
        breakpoint: 'all',
        blockId,
        message: `Block "${blockId}" is not registered in BLOCK_REGISTRY`
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates that a layout configuration is well-formed
 */
export function validateLayoutStructure(layoutMap: any): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Check required breakpoints
  const requiredBreakpoints = ['desktop', 'tablet', 'mobile']
  for (const breakpoint of requiredBreakpoints) {
    if (!layoutMap[breakpoint]) {
      errors.push({
        type: 'invalid_block',
        breakpoint,
        blockId: 'N/A',
        message: `Missing required breakpoint: ${breakpoint}`
      })
      continue
    }

    const layout = layoutMap[breakpoint]
    
    if (!Array.isArray(layout.main)) {
      errors.push({
        type: 'invalid_block',
        breakpoint,
        blockId: 'N/A',
        message: `Invalid layout structure: main must be an array at ${breakpoint}`
      })
    }

    if (!Array.isArray(layout.rail)) {
      errors.push({
        type: 'invalid_block',
        breakpoint,
        blockId: 'N/A',
        message: `Invalid layout structure: rail must be an array at ${breakpoint}`
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Comprehensive validation - runs all checks
 */
export function validateLayout(layoutMap: LayoutMap): ValidationResult {
  const structureResult = validateLayoutStructure(layoutMap)
  if (!structureResult.valid) {
    return structureResult
  }

  const layoutResult = validateLayoutMap(layoutMap)
  
  return {
    valid: layoutResult.valid,
    errors: [...structureResult.errors, ...layoutResult.errors],
    warnings: [...structureResult.warnings, ...layoutResult.warnings]
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) {
    return '✅ Layout validation passed'
  }

  const lines: string[] = ['❌ Layout validation failed:\n']

  for (const error of result.errors) {
    lines.push(`  • [${error.breakpoint}] ${error.message}`)
  }

  if (result.warnings.length > 0) {
    lines.push('\n⚠️  Warnings:')
    for (const warning of result.warnings) {
      lines.push(`  • ${warning}`)
    }
  }

  return lines.join('\n')
}
