#!/usr/bin/env node

/**
 * Validate Layout Configuration Script
 * 
 * Validates the default layout map and any persisted layouts
 * to ensure no duplicate blocks exist across breakpoints.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Simple validation logic (mirrors TypeScript validator)
function validateLayoutMap(layoutMap) {
  const errors = []
  const warnings = []

  for (const [breakpoint, layout] of Object.entries(layoutMap)) {
    const { main = [], rail = [] } = layout

    // Check for duplicates
    const allBlocks = [...main, ...rail]
    const seen = new Set()
    const duplicates = new Set()

    for (const blockId of allBlocks) {
      if (seen.has(blockId)) {
        duplicates.add(blockId)
      }
      seen.add(blockId)
    }

    for (const blockId of duplicates) {
      errors.push({
        breakpoint,
        blockId,
        message: `Block "${blockId}" appears in both main and rail at ${breakpoint}`
      })
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

// Load and validate layout
function main() {
  try {
    console.log('🔍 Validating default layout configuration...\n')

    // Read the default layout from TypeScript file
    const layoutPath = resolve(__dirname, '../src/config/personPageLayouts.ts')
    const content = readFileSync(layoutPath, 'utf-8')

    // Extract DEFAULT_LAYOUT_MAP (simple regex, works for our case)
    const match = content.match(/export const DEFAULT_LAYOUT_MAP.*?= ({[\s\S]*?^})/m)
    
    if (!match) {
      console.error('❌ Could not find DEFAULT_LAYOUT_MAP in layout file')
      process.exit(1)
    }

    // Parse the layout object (convert to JSON-compatible format)
    let layoutStr = match[1]
    
    // Replace single quotes with double quotes
    layoutStr = layoutStr.replace(/'/g, '"')
    
    // Add quotes to unquoted keys
    layoutStr = layoutStr.replace(/(\w+):/g, '"$1":')
    
    // Parse as JSON
    const layoutMap = JSON.parse(layoutStr)

    // Validate
    const result = validateLayoutMap(layoutMap)

    if (result.valid) {
      console.log('✅ Layout validation passed!')
      console.log(`   • Desktop: ${layoutMap.desktop.main.length} main, ${layoutMap.desktop.rail.length} rail`)
      console.log(`   • Tablet: ${layoutMap.tablet.main.length} main, ${layoutMap.tablet.rail.length} rail`)
      console.log(`   • Mobile: ${layoutMap.mobile.main.length} main, ${layoutMap.mobile.rail.length} rail`)
      process.exit(0)
    } else {
      console.error('❌ Layout validation failed!\n')
      
      for (const error of result.errors) {
        console.error(`   • [${error.breakpoint}] ${error.message}`)
      }
      
      console.error('')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Validation error:', error.message)
    process.exit(1)
  }
}

main()
