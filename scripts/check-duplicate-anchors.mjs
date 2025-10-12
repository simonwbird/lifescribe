#!/usr/bin/env node

/**
 * Check for Duplicate Anchor IDs
 * 
 * Validates that all blocks in the registry have unique anchor IDs
 * to prevent navigation conflicts.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function main() {
  try {
    console.log('🔍 Checking for duplicate anchor IDs...\n')

    const registryPath = resolve(__dirname, '../src/lib/blockRegistry.ts')
    const content = readFileSync(registryPath, 'utf-8')

    // Extract anchorId values using regex
    const anchorMatches = [...content.matchAll(/anchorId:\s*'([^']+)'/g)]
    const anchorIds = anchorMatches.map(match => match[1])

    if (anchorIds.length === 0) {
      console.error('❌ No anchor IDs found in block registry')
      process.exit(1)
    }

    // Check for duplicates
    const seen = new Map()
    const duplicates = []

    for (const anchorId of anchorIds) {
      if (seen.has(anchorId)) {
        duplicates.push(anchorId)
      } else {
        seen.set(anchorId, true)
      }
    }

    if (duplicates.length > 0) {
      console.error('❌ Duplicate anchor IDs found:\n')
      for (const anchorId of duplicates) {
        console.error(`   • "${anchorId}" appears multiple times`)
      }
      console.error('')
      process.exit(1)
    }

    console.log('✅ All anchor IDs are unique!')
    console.log(`   • Found ${anchorIds.length} unique anchor IDs`)
    console.log(`   • Sample anchors: ${anchorIds.slice(0, 5).join(', ')}...`)
    process.exit(0)

  } catch (error) {
    console.error('❌ Validation error:', error.message)
    process.exit(1)
  }
}

main()
