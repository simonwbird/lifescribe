/**
 * ESLint rule: no-ad-hoc-date-formatting
 * 
 * Prevents ad-hoc date formatting in favor of centralized formatForUser utility
 * Auto-fixes simple cases with suggested replacements
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce centralized date formatting via formatForUser utility',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowedMethods: {
            type: 'array',
            items: { type: 'string' },
            default: ['toISOString', 'getTime', 'valueOf']
          },
          allowInTests: {
            type: 'boolean',
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noToLocaleDateString: 'Use formatForUser({{source}}, \'{{kind}}\', userRegion) instead of {{method}}()',
      noToLocaleString: 'Use formatForUser({{source}}, \'datetime\', userRegion) instead of {{method}}()',
      noFormatDistanceToNow: 'Use formatForUser({{source}}, \'relative\', userRegion) instead of formatDistanceToNow()',
      noDirectDateFormatting: 'Use formatForUser() for consistent date formatting instead of {{method}}()',
      missingImport: 'formatForUser is not imported. Add: import { formatForUser } from \'@/utils/date\'',
    }
  },

  create(context) {
    const options = context.options[0] || {}
    const allowedMethods = options.allowedMethods || ['toISOString', 'getTime', 'valueOf']
    const allowInTests = options.allowInTests !== false
    
    const filename = context.getFilename()
    const isTestFile = allowInTests && (
      filename.includes('.test.') || 
      filename.includes('.spec.') ||
      filename.includes('/__tests__/') ||
      filename.includes('/test/')
    )
    
    const isUtilityFile = filename.includes('/utils/date.ts') || 
                         filename.includes('/DateFormattingExample') ||
                         filename.includes('/DateMigrationDemo')
    
    if (isTestFile || isUtilityFile) {
      return {} // Skip test files and our own utility files
    }
    
    let hasFormatForUserImport = false
    let formatForUserImportNode = null
    
    return {
      ImportDeclaration(node) {
        if (node.source.value === '@/utils/date') {
          const formatForUserSpecifier = node.specifiers.find(
            spec => spec.type === 'ImportSpecifier' && spec.imported.name === 'formatForUser'
          )
          if (formatForUserSpecifier) {
            hasFormatForUserImport = true
            formatForUserImportNode = node
          }
        }
      },
      
      CallExpression(node) {
        // Check for date formatting method calls
        if (node.callee.type === 'MemberExpression') {
          const methodName = node.callee.property.name
          const objectSource = context.getSourceCode().getText(node.callee.object)
          
          // Detect forbidden date formatting methods
          if (methodName === 'toLocaleDateString') {
            reportDateFormatting(node, 'noToLocaleDateString', methodName, objectSource, inferDateKind(objectSource, node))
          } else if (methodName === 'toLocaleString') {
            reportDateFormatting(node, 'noToLocaleString', methodName, objectSource, 'datetime')
          } else if (methodName === 'toLocaleTimeString') {
            reportDateFormatting(node, 'noToLocaleString', methodName, objectSource, 'datetime')
          } else if (methodName === 'toString' && isDateObject(objectSource)) {
            reportDateFormatting(node, 'noDirectDateFormatting', methodName, objectSource, 'datetime')
          }
        }
        
        // Check for formatDistanceToNow calls
        if (node.callee.type === 'Identifier' && node.callee.name === 'formatDistanceToNow') {
          const firstArg = node.arguments[0]
          if (firstArg) {
            let sourceText = context.getSourceCode().getText(firstArg)
            
            // Extract inner expression from new Date(...)
            if (sourceText.startsWith('new Date(') && sourceText.endsWith(')')) {
              sourceText = sourceText.slice(9, -1)
            }
            
            reportRelativeFormatting(node, sourceText)
          }
        }
      }
    }
    
    function reportDateFormatting(node, messageId, methodName, objectSource, kind) {
      context.report({
        node,
        messageId,
        data: {
          method: methodName,
          source: objectSource,
          kind
        },
        fix(fixer) {
          if (!hasFormatForUserImport) {
            return null // Can't auto-fix without import
          }
          
          const replacement = `formatForUser(${objectSource}, '${kind}', userRegion)`
          return fixer.replaceText(node, replacement)
        },
        suggest: [
          {
            desc: `Replace with formatForUser(${objectSource}, '${kind}', userRegion)`,
            fix(fixer) {
              const replacement = `formatForUser(${objectSource}, '${kind}', userRegion)`
              return fixer.replaceText(node, replacement)
            }
          }
        ]
      })
    }
    
    function reportRelativeFormatting(node, sourceText) {
      context.report({
        node,
        messageId: 'noFormatDistanceToNow',
        data: {
          source: sourceText
        },
        fix(fixer) {
          if (!hasFormatForUserImport) {
            return null
          }
          
          const replacement = `formatForUser(${sourceText}, 'relative', userRegion)`
          return fixer.replaceText(node, replacement)
        },
        suggest: [
          {
            desc: `Replace with formatForUser(${sourceText}, 'relative', userRegion)`,
            fix(fixer) {
              const replacement = `formatForUser(${sourceText}, 'relative', userRegion)`
              return fixer.replaceText(node, replacement)
            }
          }
        ]
      })
    }
    
    function inferDateKind(objectSource, node) {
      const sourceText = objectSource.toLowerCase()
      
      // Check for date-only patterns
      const dateOnlyPatterns = [
        'birth_date', 'death_date', 'birthday', 'anniversary',
        'occurred_on', 'event_date', 'date_of_birth'
      ]
      
      if (dateOnlyPatterns.some(pattern => sourceText.includes(pattern))) {
        return 'dateOnly'
      }
      
      // Check for timestamp patterns
      const timestampPatterns = [
        'created_at', 'updated_at', 'timestamp', 'time'
      ]
      
      if (timestampPatterns.some(pattern => sourceText.includes(pattern))) {
        return 'datetime'
      }
      
      return 'datetime' // Default to datetime
    }
    
    function isDateObject(objectSource) {
      // Simple heuristic to detect if this is likely a Date object
      return objectSource.includes('Date(') || 
             objectSource.includes('date') ||
             objectSource.includes('time')
    }
  }
}

module.exports.meta = {
  ...module.exports.meta,
  version: '1.0.0'
}