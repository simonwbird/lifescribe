# Phase 0 Localization: Date/Time Components Checklist

## Critical Date/Time Rendering Components (Must Fix)

### Birthday & Age Calculations
- [ ] `src/components/people/DatesPanel.tsx` - Birth/death dates, age display, days to birthday
- [ ] `src/components/people/PeopleDirectory.tsx` - Age calculation in person cards
- [ ] `src/components/people/PeopleTable.tsx` - Age column, upcoming birthdays
- [ ] `src/components/home/UpcomingBirthdays.tsx` - Birthday countdown display
- [ ] `src/utils/dateUtils.ts` - Core birthday/age calculation functions
- [ ] `src/utils/personUtils.ts` - Person-specific date formatting

### Timeline & Story Dates  
- [ ] `src/components/TimelineCanvas.tsx` - Timeline bucket rendering
- [ ] `src/components/StoryCard.tsx` - Story occurrence dates
- [ ] `src/lib/timelineBuckets.ts` - Timeline date bucketing logic
- [ ] `src/components/ActivityFeed.tsx` - Activity timestamps

### Weekly Digest & Scheduling
- [ ] `src/components/WeeklyDigestPreview.tsx` - Digest generation dates
- [ ] `src/components/admin/DigestScheduler.tsx` - Scheduling interface
- [ ] `src/components/admin/DigestHistoryModal.tsx` - Historical digest times
- [ ] `src/lib/weeklyDigestService.ts` - Digest timing logic

### Form Inputs & Date Pickers
- [ ] `src/components/DatePrecisionPicker.tsx` - Date input formatting
- [ ] `src/components/story-wizard/StoryWizard.tsx` - Story date inputs
- [ ] `src/components/people/PersonForm.tsx` - Birth/death date forms

## Secondary Components (Lower Priority)

### Comments & Interactions
- [ ] `src/components/CommentThread.tsx` - Comment timestamps
- [ ] `src/components/AnswerCard.tsx` - Answer creation dates
- [ ] `src/components/ReactionBar.tsx` - Reaction timestamps

### Admin & Analytics
- [ ] `src/components/admin/ActivationFunnelChart.tsx` - User signup dates
- [ ] `src/components/admin/AdminGlobalSearch.tsx` - Search result dates
- [ ] `src/components/admin/AuditLogViewer.tsx` - Audit event timestamps
- [ ] `src/components/analytics/MVPMetricsDashboard.tsx` - Metrics timestamps

### Invites & Onboarding
- [ ] `src/components/InviteModal.tsx` - Invite expiration dates
- [ ] `src/components/OnboardingWizard.tsx` - Account creation dates

### Media & Content
- [ ] `src/components/MediaUploader.tsx` - Upload timestamps
- [ ] `src/components/LinkExistingDialog.tsx` - Content creation dates

## Database Fields Using Dates

### Person/Family Data
- `people.birth_date` (YYYY-MM-DD) - ✓ Date-only, no timezone issues
- `people.death_date` (YYYY-MM-DD) - ✓ Date-only, no timezone issues  
- `life_events.event_date` (YYYY-MM-DD) - ✓ Date-only, no timezone issues

### Timestamped Records (UTC ISO 8601)
- `stories.created_at`, `stories.updated_at`, `stories.occurred_on`
- `comments.created_at`, `comments.updated_at`
- `media.created_at`
- `reactions.created_at`
- `notifications.created_at`
- `invites.created_at`, `invites.expires_at`, `invites.accepted_at`
- `members.joined_at`
- `profiles.created_at`, `profiles.updated_at`

## Implementation Phases

### Phase 1: Core Utilities
1. Create localized date formatting service
2. Update dateUtils.ts with locale-aware functions
3. Update personUtils.ts with timezone-aware calculations

### Phase 2: High-Impact Components
1. Birthday/age calculations (affects user engagement)
2. Timeline and story dates (affects content display)
3. Date input forms (affects data quality)

### Phase 3: Lower-Impact Components  
1. Admin interfaces
2. Comment timestamps
3. Analytics displays

## Technical Notes

### Canonical Storage Principles ✓
- Timestamps: Store in UTC ISO 8601 format
- Date-only facts: Store as YYYY-MM-DD (no timezone)
- Never shift birthday dates based on timezone

### User Preferences Added ✓
- `profiles.locale` - BCP-47 format (en-US, en-GB, etc.)
- `profiles.timezone` - IANA format (America/New_York, Europe/London, etc.)  
- `profiles.country` - ISO 3166-1 alpha-2 (US, GB, etc.)
- `profiles.date_format_preference` - Optional override

### Common Locale Patterns
- US: MM/dd/yyyy, 12-hour time
- UK: dd/MM/yyyy, 24-hour time  
- ISO: yyyy-MM-dd, 24-hour time

## Acceptance Criteria

- [ ] All birthday calculations respect user's timezone for "today" comparisons
- [ ] All date displays use user's locale formatting
- [ ] Timeline buckets labeled in user's preferred format
- [ ] Story dates never shift due to timezone (canonical YYYY-MM-DD)
- [ ] Weekly digest scheduling uses user's timezone
- [ ] Date input forms accept locale-appropriate formats
- [ ] No hardcoded 'en-US' or timezone assumptions remain

## Testing Scenarios

1. **Birthday Edge Cases**
   - User in UTC+11 (Sydney) sees birthday countdown correctly
   - User in UTC-8 (LA) sees same person's birthday on same calendar date
   - Feb 29 leap year birthdays handled correctly across timezones

2. **Story Dating**
   - Story marked "Dec 25, 2023" displays as Dec 25 for all users regardless of timezone
   - Story created timestamp shows correctly in each user's local time

3. **Weekly Digest**
   - UK user (Sunday 9 AM GMT) and US user (Sunday 9 AM EST) both get digest at their local time
   - Digest content shows same birthday dates despite different timezones