#!/usr/bin/env tsx
/**
 * Codemod to replace ad-hoc date formatting with centralized formatForUser utility
 * Usage: npx tsx scripts/codemod-date-formatting.ts [--dry-run] [--fix]
 */

import { Project, Node, SyntaxKind, CallExpression, PropertyAccessExpression } from 'ts-morph'
import { glob } from 'glob'
import path from 'path'

interface Replacement {
  file: string
  line: number
  column: number
  original: string
  replacement: string
  kind: 'dateOnly' | 'datetime' | 'relative'
  confidence: 'high' | 'medium' | 'low'
}

const replacements: Replacement[] = []

function analyzeAndReplace(project: Project, isDryRun: boolean = true) {
  const sourceFiles = project.getSourceFiles()
  
  sourceFiles.forEach(sourceFile => {
    const filePath = sourceFile.getFilePath()
    
    // Skip our own utility files and tests
    if (filePath.includes('/utils/date.ts') || 
        filePath.includes('/__tests__/') ||
        filePath.includes('/DateFormattingExample') ||
        filePath.includes('/DateMigrationDemo')) {
      return
    }
    
    // Find all property access expressions
    sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach(node => {
      const parent = node.getParent()
      
      // Handle toLocaleDateString() calls
      if (node.getName() === 'toLocaleDateString' && Node.isCallExpression(parent)) {
        handleToLocaleDateString(node, parent, sourceFile.getFilePath())
      }
      
      // Handle toLocaleString() calls  
      if (node.getName() === 'toLocaleString' && Node.isCallExpression(parent)) {
        handleToLocaleString(node, parent, sourceFile.getFilePath())
      }
      
      // Handle toLocaleTimeString() calls
      if (node.getName() === 'toLocaleTimeString' && Node.isCallExpression(parent)) {
        handleToLocaleTimeString(node, parent, sourceFile.getFilePath())
      }
      
      // Handle getFullYear() for year-only display
      if (node.getName() === 'getFullYear' && Node.isCallExpression(parent)) {
        handleGetFullYear(node, parent, sourceFile.getFilePath())
      }
    })
    
    // Find formatDistanceToNow calls
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(node => {
      if (Node.isCallExpression(node)) {
        const expression = node.getExpression()
        if (Node.isIdentifier(expression) && expression.getText() === 'formatDistanceToNow') {
          handleFormatDistanceToNow(node, sourceFile.getFilePath())
        }
      }
    })
    
    // Apply replacements if not dry run
    if (!isDryRun) {
      applyReplacements(sourceFile)
    }
  })
}

function handleToLocaleDateString(node: PropertyAccessExpression, parent: CallExpression, filePath: string) {
  const sourceObject = node.getExpression().getText()
  const args = parent.getArguments()
  const { line, column } = node.getSourceFile().getLineAndColumnAtPos(node.getStart())
  
  // Determine if this is likely a birthday/anniversary (dateOnly) or timestamp (datetime)
  const isLikelyDateOnly = inferDateOnlyContext(sourceObject, node)
  const kind = isLikelyDateOnly ? 'dateOnly' : 'datetime'
  
  let replacement: string
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  
  if (args.length === 0) {
    // Basic toLocaleDateString() -> formatForUser(value, kind, userRegion)
    replacement = `formatForUser(${sourceObject}, '${kind}', userRegion)`
    confidence = 'high'
  } else if (args.length === 1) {
    // toLocaleDateString('en-US') -> formatForUser(value, kind, userRegion)
    replacement = `formatForUser(${sourceObject}, '${kind}', userRegion)`
    confidence = 'high'
  } else {
    // toLocaleDateString('en-US', options) -> needs manual review
    replacement = `formatForUser(${sourceObject}, '${kind}', userRegion) /* TODO: Review options: ${args.slice(1).map(a => a.getText()).join(', ')} */`
    confidence = 'low'
  }
  
  replacements.push({
    file: filePath,
    line,
    column,
    original: parent.getText(),
    replacement,
    kind,
    confidence
  })
}

function handleToLocaleString(node: PropertyAccessExpression, parent: CallExpression, filePath: string) {
  const sourceObject = node.getExpression().getText()
  const { line, column } = node.getSourceFile().getLineAndColumnAtPos(node.getStart())
  
  // toLocaleString() typically includes both date and time
  const replacement = `formatForUser(${sourceObject}, 'datetime', userRegion)`
  
  replacements.push({
    file: filePath,
    line,
    column,
    original: parent.getText(),
    replacement,
    kind: 'datetime',
    confidence: 'high'
  })
}

function handleToLocaleTimeString(node: PropertyAccessExpression, parent: CallExpression, filePath: string) {
  const sourceObject = node.getExpression().getText()
  const { line, column } = node.getSourceFile().getLineAndColumnAtPos(node.getStart())
  
  // Time-only display is less common, treat as datetime for now
  const replacement = `formatForUser(${sourceObject}, 'datetime', userRegion) /* TODO: Consider time-only format */`
  
  replacements.push({
    file: filePath,
    line,
    column,
    original: parent.getText(),
    replacement,
    kind: 'datetime',
    confidence: 'low'
  })
}

function handleGetFullYear(node: PropertyAccessExpression, parent: CallExpression, filePath: string) {
  const sourceObject = node.getExpression().getText()
  const { line, column } = node.getSourceFile().getLineAndColumnAtPos(node.getStart())
  
  // getFullYear() in UI context usually means year-only display
  if (isInUIContext(node)) {
    const replacement = `formatForUser(${sourceObject}, 'dateOnly', userRegion) /* TODO: May need year-only option */`
    
    replacements.push({
      file: filePath,
      line,
      column,
      original: parent.getText(),
      replacement,
      kind: 'dateOnly',
      confidence: 'medium'
    })
  }
}

function handleFormatDistanceToNow(node: CallExpression, filePath: string) {
  const args = node.getArguments()
  const { line, column } = node.getSourceFile().getLineAndColumnAtPos(node.getStart())
  
  if (args.length > 0) {
    const dateArg = args[0].getText()
    
    // Extract the inner date if it's new Date(...)
    const innerDate = dateArg.startsWith('new Date(') ? 
      dateArg.slice(9, -1) : dateArg
    
    const replacement = `formatForUser(${innerDate}, 'relative', userRegion)`
    
    replacements.push({
      file: filePath,
      line,
      column,
      original: node.getText(),
      replacement,
      kind: 'relative',
      confidence: 'high'
    })
  }
}

function inferDateOnlyContext(sourceObject: string, node: Node): boolean {
  const text = node.getSourceFile().getText()
  const nodeText = sourceObject.toLowerCase()
  
  // Check for common date-only field names
  const dateOnlyPatterns = [
    'birth_date', 'death_date', 'birthday', 'anniversary',
    'occurred_on', 'event_date', 'date_of_birth'
  ]
  
  return dateOnlyPatterns.some(pattern => 
    nodeText.includes(pattern) || 
    text.toLowerCase().includes(pattern)
  )
}

function isInUIContext(node: Node): boolean {
  // Check if this node is inside a JSX expression or return statement
  let parent = node.getParent()
  while (parent) {
    if (Node.isJsxExpression(parent) || 
        Node.isReturnStatement(parent) ||
        Node.isJsxElement(parent)) {
      return true
    }
    parent = parent.getParent()
  }
  return false
}

function applyReplacements(sourceFile: any) {
  // Add import for formatForUser if not present
  const imports = sourceFile.getImportDeclarations()
  const hasDateUtilImport = imports.some((imp: any) => 
    imp.getModuleSpecifierValue()?.includes('/utils/date')
  )
  
  if (!hasDateUtilImport && replacements.some(r => r.file === sourceFile.getFilePath())) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: '@/utils/date',
      namedImports: ['formatForUser', 'getCurrentUserRegion']
    })
    
    // Add userRegion constant at top of component
    const firstFunction = sourceFile.getFunctions()[0] || sourceFile.getClasses()[0]
    if (firstFunction) {
      firstFunction.insertStatements(0, 'const userRegion = getCurrentUserRegion()')
    }
  }
  
  // Apply text replacements (simplified - production would need more sophisticated AST manipulation)
  let content = sourceFile.getFullText()
  replacements
    .filter(r => r.file === sourceFile.getFilePath())
    .sort((a, b) => b.line - a.line) // Apply from bottom to top to preserve line numbers
    .forEach(replacement => {
      content = content.replace(replacement.original, replacement.replacement)
    })
  
  sourceFile.replaceWithText(content)
}

function generateDryRunReport() {
  console.log('\n🔍 Date Formatting Codemod - Dry Run Report\n')
  
  const fileGroups = replacements.reduce((groups, replacement) => {
    const relativePath = path.relative(process.cwd(), replacement.file)
    if (!groups[relativePath]) {
      groups[relativePath] = []
    }
    groups[relativePath].push(replacement)
    return groups
  }, {} as Record<string, Replacement[]>)
  
  console.log(`📊 Summary: ${replacements.length} replacements across ${Object.keys(fileGroups).length} files\n`)
  
  // Count by type
  const byCounts = replacements.reduce((counts, r) => {
    counts[r.kind] = (counts[r.kind] || 0) + 1
    return counts
  }, {} as Record<string, number>)
  
  console.log('📈 Replacement Types:')
  Object.entries(byCounts).forEach(([kind, count]) => {
    console.log(`  ${kind}: ${count}`)
  })
  
  // Count by confidence
  const byConfidence = replacements.reduce((counts, r) => {
    counts[r.confidence] = (counts[r.confidence] || 0) + 1
    return counts
  }, {} as Record<string, number>)
  
  console.log('\n🎯 Confidence Levels:')
  Object.entries(byConfidence).forEach(([confidence, count]) => {
    const emoji = confidence === 'high' ? '✅' : confidence === 'medium' ? '⚠️' : '🚨'
    console.log(`  ${emoji} ${confidence}: ${count}`)
  })
  
  console.log('\n📁 Files to be modified:\n')
  
  Object.entries(fileGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([file, fileReplacements]) => {
      console.log(`📄 ${file} (${fileReplacements.length} replacements)`)
      
      fileReplacements
        .sort((a, b) => a.line - b.line)
        .forEach(replacement => {
          const emoji = replacement.confidence === 'high' ? '✅' : 
                       replacement.confidence === 'medium' ? '⚠️' : '🚨'
          console.log(`   ${emoji} Line ${replacement.line}: ${replacement.kind}`)
          console.log(`      - ${replacement.original}`)
          console.log(`      + ${replacement.replacement}`)
        })
      console.log()
    })
  
  console.log('\n🚨 High Priority Files (low confidence replacements):')
  const lowConfidenceFiles = Object.entries(fileGroups)
    .filter(([_, repls]) => repls.some(r => r.confidence === 'low'))
    .map(([file]) => file)
  
  if (lowConfidenceFiles.length > 0) {
    lowConfidenceFiles.forEach(file => console.log(`  - ${file}`))
    console.log('\nThese files need manual review after codemod application.')
  } else {
    console.log('  None - all replacements are medium to high confidence!')
  }
}

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = !args.includes('--fix')
  
  console.log('🚀 Starting Date Formatting Codemod...')
  
  // Initialize TypeScript project
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
  })
  
  // Add source files
  const sourceFiles = await glob('src/**/*.{ts,tsx}', { ignore: ['**/*.test.*', '**/*.spec.*'] })
  project.addSourceFilesAtPaths(sourceFiles)
  
  console.log(`📂 Loaded ${sourceFiles.length} source files`)
  
  // Analyze and optionally apply replacements
  analyzeAndReplace(project, isDryRun)
  
  if (isDryRun) {
    generateDryRunReport()
    console.log('\n💡 To apply changes, run: npx tsx scripts/codemod-date-formatting.ts --fix')
  } else {
    console.log(`\n✅ Applied ${replacements.length} replacements!`)
    console.log('🔧 Saving files...')
    await project.save()
    console.log('✨ Codemod complete!')
  }
}

if (require.main === module) {
  main().catch(console.error)
}