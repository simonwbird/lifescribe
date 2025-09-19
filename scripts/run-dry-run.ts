#!/usr/bin/env tsx
/**
 * Quick script to simulate the codemod dry run for demonstration
 * This gives a preview of what the actual codemod would find
 */

import { readFileSync } from 'fs'
import { glob } from 'glob'

interface Finding {
  file: string
  line: number
  pattern: string
  suggestion: string
  confidence: 'high' | 'medium' | 'low'
  kind: 'dateOnly' | 'datetime' | 'relative'
}

const findings: Finding[] = []

const patterns = [
  {
    regex: /new Date\([^)]+\)\.toLocaleDateString\(\)/g,
    kind: 'datetime' as const,
    confidence: 'high' as const,
    getSuggestion: (match: string) => {
      const source = match.match(/new Date\(([^)]+)\)/)?.[1] || 'dateValue'
      return `formatForUser(${source}, 'datetime', userRegion)`
    }
  },
  {
    regex: /formatDistanceToNow\(new Date\(([^)]+)\)[^)]*\)/g,
    kind: 'relative' as const,
    confidence: 'high' as const,
    getSuggestion: (match: string, source: string) => `formatForUser(${source}, 'relative', userRegion)`
  },
  {
    regex: /\.toLocaleDateString\('en-US'[^)]*\)/g,
    kind: 'dateOnly' as const,
    confidence: 'medium' as const,
    getSuggestion: () => `formatForUser(value, 'dateOnly', userRegion)`
  }
]

async function analyzeSampleFiles() {
  const sampleFiles = [
    'src/components/StoryCard.tsx',
    'src/components/ActivityFeed.tsx', 
    'src/components/AnswerCard.tsx',
    'src/components/CommentThread.tsx',
    'src/components/people/PeopleTable.tsx'
  ]
  
  console.log('🔍 Date Formatting Codemod - Quick Dry Run Sample\n')
  
  for (const filePath of sampleFiles) {
    try {
      const content = readFileSync(filePath, 'utf8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        patterns.forEach(pattern => {
          const matches = [...line.matchAll(pattern.regex)]
          matches.forEach(match => {
            findings.push({
              file: filePath,
              line: index + 1,
              pattern: match[0],
              suggestion: pattern.getSuggestion(match[0], match[1]),
              confidence: pattern.confidence,
              kind: pattern.kind
            })
          })
        })
      })
    } catch (error) {
      // File might not exist in demo
      console.log(`⚠️ Could not read ${filePath}`)
    }
  }
  
  console.log(`📊 Found ${findings.length} potential replacements in sample files:\n`)
  
  findings.forEach(finding => {
    const emoji = finding.confidence === 'high' ? '✅' : finding.confidence === 'medium' ? '⚠️' : '🚨'
    console.log(`${emoji} ${finding.file.replace('src/', '')}:${finding.line}`)
    console.log(`   ${finding.kind} (${finding.confidence} confidence)`)
    console.log(`   - ${finding.pattern}`)
    console.log(`   + ${finding.suggestion}\n`)
  })
  
  console.log('💡 To run full codemod analysis:')
  console.log('   npm run codemod:date-dry-run')
  console.log('\n💡 To apply fixes:') 
  console.log('   npm run codemod:date-apply')
  console.log('\n💡 To check ESLint violations:')
  console.log('   npm run lint:date-formatting')
}

analyzeSampleFiles().catch(console.error)