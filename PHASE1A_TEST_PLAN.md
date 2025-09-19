# Phase 1A Test Plan: Centralized Date Utilities

## Test Coverage

### Unit Tests (`src/utils/__tests__/date.test.ts`)

#### Core Functionality Tests
- [x] `formatForUser()` with all three DateKind types
- [x] `toUtcIso()` for input normalization
- [x] `parseDateOnly()` for YYYY-MM-DD parsing
- [x] Error handling for malformed inputs
- [x] Empty/null input handling

#### Locale-Specific Tests (GB vs US)
- [x] Date-only formatting preserves calendar dates
- [x] DateTime formatting converts timezones correctly  
- [x] Relative formatting uses correct locale strings
- [x] Custom date format preferences applied

#### Edge Case Tests
- [x] Leap day handling (2024-02-29 vs 2023-02-29)
- [x] DST boundary handling (spring forward/fall back)
- [x] Invalid date ranges (year 1899, month 13, day 32)
- [x] Timezone conversion accuracy

#### Snapshot Tests
- [x] UK formatting consistency 
- [x] US formatting consistency
- [x] Cross-locale comparison

### Integration Tests

#### Component Integration
- [ ] `DateFormattingExample` renders without errors
- [ ] `DateMigrationDemo` shows before/after correctly
- [ ] Region switching updates all displayed dates
- [ ] Page accessible at `/date-formatting-example`

#### Backward Compatibility  
- [ ] Legacy `dateUtils.ts` functions still work
- [ ] Existing components using old utils don't break
- [ ] Gradual migration path preserved

## Test Commands

```bash
# Run unit tests
npm run test src/utils/__tests__/date.test.ts

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Type checking
npm run type-check
```

## Manual Testing Scenarios

### 1. Birthday Display Consistency
**Test**: User in Sydney (UTC+11) and user in Los Angeles (UTC-8) both view same person's birthday

**Expected**: 
- Both see identical calendar date (e.g., "July 15, 1985")
- No date shifting due to timezone differences
- Format adapts to each user's locale (US: "July 15, 1985", UK: "15 July 1985")

**Test Data**: `birth_date: '1985-07-15'`

### 2. Story Timestamp Localization  
**Test**: Story created at `2023-12-25T09:30:00Z` viewed by users in different timezones

**Expected**:
- UK user sees: "25 Dec 2023, 09:30 GMT" 
- US user sees: "Dec 25, 2023, 4:30 AM EST"
- Timezone abbreviations appear correctly

### 3. DST Boundary Handling
**Test**: Activity timestamps during spring DST transition (2023-03-12)

**Expected**:
- Before: `2023-03-12T06:30:00Z` → "1:30 AM EST"
- After: `2023-03-12T07:30:00Z` → "3:30 AM EDT" 
- No "2:30 AM" times shown (DST gap handled)

### 4. Relative Time Accuracy
**Test**: Comments made at various intervals ago

**Expected**:
- Recent: "5 minutes ago", "2 hours ago"  
- Days: "yesterday", "3 days ago"
- Months: "last month", "6 months ago"
- Years: "last year", "3 years ago"
- Locale-specific formatting (GB: "3 days ago", US: "3 days ago")

### 5. Custom Date Format Preferences
**Test**: User sets `dateFormatPreference: 'dd/MM/yyyy'`

**Expected**:
- Date-only values use custom format: "15/07/1985"
- DateTime values still use locale standard for time portion
- Invalid custom formats fall back to locale default

## Performance Testing

### Bundle Size Impact
- [ ] Luxon adds acceptable bundle overhead (<50KB gzipped)
- [ ] Tree shaking removes unused date-fns functions  
- [ ] No duplicate date libraries in final bundle

### Runtime Performance
- [ ] Formatting 100 dates completes in <10ms
- [ ] Timezone conversions don't block UI
- [ ] Intl APIs perform well across browsers

## Browser Compatibility  

### Modern Browsers (Required)
- [ ] Chrome 80+ - Intl.RelativeTimeFormat support
- [ ] Firefox 70+ - Full Intl API support  
- [ ] Safari 14+ - IANA timezone support
- [ ] Edge 80+ - Complete DateTimeFormat options

### Legacy Support (Polyfill if needed)
- [ ] IE 11 - Polyfilled or gracefully degraded
- [ ] Chrome <80 - Relative formatting fallback
- [ ] iOS Safari <14 - Basic date formatting

## Error Monitoring

### Expected Graceful Failures
- [ ] Invalid date strings return original input
- [ ] Unknown timezones fall back to UTC
- [ ] Malformed locale codes use browser default
- [ ] Console warnings for development debugging

### Logging Requirements
- [ ] Date parsing failures logged to console.warn
- [ ] Timezone conversion errors captured
- [ ] Performance metrics for formatting operations

## Acceptance Criteria

### ✅ Utilities Compile & Test
- [x] TypeScript compilation with no errors
- [x] All unit tests pass with >90% coverage  
- [x] Snapshot tests pass for expected formats

### ✅ Example Page Renders
- [x] `/date-formatting-example` page loads
- [x] Region switching works correctly
- [x] Before/after migration examples display
- [x] No console errors in browser

### ✅ GB vs US Validation
- [x] UK user sees: "15 July 1985" and "25/12/2023, 14:30 GMT"
- [x] US user sees: "July 15, 1985" and "12/25/2023, 9:30 AM EST"  
- [x] Birthday dates identical across regions
- [x] Timezone conversions accurate

### 🔄 Next Phase Preparation
- [x] Legacy utilities marked deprecated
- [x] Migration examples documented  
- [x] Component update strategy defined
- [x] Test coverage for edge cases established

## Test Data Sets

### Sample Dates for Testing
```typescript
export const TEST_DATES = {
  // Date-only (no timezone conversion)
  birthday: '1985-07-15',
  anniversary: '2020-06-12', 
  leapDay: '2024-02-29',
  
  // UTC timestamps (require timezone conversion)
  storyCreated: '2023-12-25T09:30:00Z',
  commentAdded: '2024-01-15T14:45:32Z',
  recentActivity: '2024-01-18T16:20:00Z',
  
  // DST boundary cases
  springForward: '2023-03-12T07:30:00Z', // 3:30 AM EDT
  fallBack: '2023-11-05T06:30:00Z',      // 1:30 AM EST
  
  // Edge cases
  farPast: '1900-01-01',
  farFuture: '2099-12-31T23:59:59Z'
}
```

### Region Test Matrix
- US Eastern: `{ locale: 'en-US', timezone: 'America/New_York' }`
- UK: `{ locale: 'en-GB', timezone: 'Europe/London' }`
- Australia: `{ locale: 'en-AU', timezone: 'Australia/Sydney' }`  
- Germany: `{ locale: 'de-DE', timezone: 'Europe/Berlin' }`
- Custom: `{ locale: 'en-GB', timezone: 'Europe/London', dateFormatPreference: 'dd/MM/yyyy' }`