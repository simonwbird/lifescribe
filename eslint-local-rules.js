/**
 * ESLint local rules plugin configuration
 */

const noAdHocDateFormatting = require('./eslint-rules/no-ad-hoc-date-formatting')

module.exports = {
  'no-ad-hoc-date-formatting': noAdHocDateFormatting
}