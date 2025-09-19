/**
 * ESLint configuration for enforcing centralized date formatting
 */

module.exports = {
  extends: ['./.eslintrc.js'],
  plugins: ['local'],
  rules: {
    // Enforce centralized date formatting
    'local/no-ad-hoc-date-formatting': 'error',
    
    // Temporarily allow some patterns during migration
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^userRegion$' // Allow userRegion variable
    }],
  },
  settings: {
    'local-rules': {
      'no-ad-hoc-date-formatting': require('./eslint-rules/no-ad-hoc-date-formatting')
    }
  }
}