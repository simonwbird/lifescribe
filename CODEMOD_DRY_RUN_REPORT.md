# 🔍 Date Formatting Codemod - Dry Run Report

## 📊 Summary: 127 replacements across 43 files

### 📈 Replacement Types:
- **dateOnly**: 31 (birthdays, anniversaries, occurred_on dates)
- **datetime**: 58 (created_at, updated_at timestamps)  
- **relative**: 38 (activity feeds, time ago displays)

### 🎯 Confidence Levels:
- ✅ **high**: 89 (simple direct replacements)
- ⚠️ **medium**: 26 (context-inferred replacements)
- 🚨 **low**: 12 (complex cases needing manual review)

---

## 📁 Files to be modified:

### 📄 src/components/ActivityFeed.tsx (4 replacements)
   ✅ Line 223: datetime
      - `new Date(b.created_at).getTime() - new Date(a.created_at).getTime()`
      + `/* Keep for sorting - no UI change needed */`
   
   ✅ Line 309: relative  
      - `formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })`
      + `formatForUser(activity.created_at, 'relative', userRegion)`
   
   ✅ Line 382: relative
      - `formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })`  
      + `formatForUser(activity.created_at, 'relative', userRegion)`

### 📄 src/components/AnswerCard.tsx (1 replacement)
   ✅ Line 60: datetime
      - `new Date(answer.created_at).toLocaleDateString()`
      + `formatForUser(answer.created_at, 'datetime', userRegion)`

### 📄 src/components/CommentThread.tsx (1 replacement)
   ✅ Line 148: datetime
      - `new Date(comment.created_at).toLocaleDateString()`
      + `formatForUser(comment.created_at, 'datetime', userRegion)`

### 📄 src/components/StoryCard.tsx (4 replacements)
   ✅ Line 172: datetime
      - `new Date(story.created_at).toLocaleDateString()`
      + `formatForUser(story.created_at, 'datetime', userRegion)`
   
   ✅ Line 184: dateOnly
      - `new Date(story.occurred_on).getFullYear()`
      + `formatForUser(story.occurred_on, 'dateOnly', userRegion) /* TODO: May need year-only option */`
   
   ⚠️ Line 185: dateOnly  
      - `new Date(story.occurred_on).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })`
      + `formatForUser(story.occurred_on, 'dateOnly', userRegion) /* TODO: Review options: { year: 'numeric', month: 'long' } */`
   
   ✅ Line 186: dateOnly
      - `new Date(story.occurred_on).toLocaleDateString()`
      + `formatForUser(story.occurred_on, 'dateOnly', userRegion)`

### 📄 src/components/people/DatesPanel.tsx (3 replacements)
   ✅ Line 52: relative
      - `computeAge(person.birth_date, person.death_date)`  
      + `/* Keep computeAge for calculations - this is not UI formatting */`
   
   ✅ Line 90: dateOnly
      - `new Date(person.birth_date).toLocaleDateString()`
      + `formatForUser(person.birth_date, 'dateOnly', userRegion)`

### 📄 src/components/people/PeopleTable.tsx (6 replacements)
   ✅ Line 87: relative
      - `calculateAge(a.birth_date, a.death_date, a.is_living !== false)`
      + `/* Keep calculateAge for sorting - not UI display */`
   
   ✅ Line 285: relative  
      - `calculateAge(person.birth_date, person.death_date, person.is_living !== false)`
      + `formatForUser(person.birth_date, 'relative', userRegion) /* Age display */`
   
   ✅ Line 286: relative
      - `calculateDaysUntilBirthday(person.birth_date)`  
      + `formatForUser(person.birth_date, 'relative', userRegion) /* Days until birthday */`

### 📄 src/components/admin/ActivationFunnelChart.tsx (3 replacements)
   ✅ Line 88: datetime
      - `stage.count.toLocaleString()`
      + `stage.count.toLocaleString() /* Keep number formatting - not date */`
   
   ✅ Line 177: relative
      - `formatDistanceToNow(new Date(family.createdAt), { addSuffix: true })`
      + `formatForUser(family.createdAt, 'relative', userRegion)`

### 📄 src/components/admin/AdminGlobalSearch.tsx (1 replacement)
   ✅ Line 215: datetime
      - `new Date(result.metadata.created_at).toLocaleDateString()`
      + `formatForUser(result.metadata.created_at, 'datetime', userRegion)`

### 📄 src/components/admin/AdminShell.tsx (1 replacement)
   ✅ Line 229: datetime
      - `new Date().toLocaleString()`  
      + `formatForUser(new Date().toISOString(), 'datetime', userRegion)`

### 📄 src/components/admin/BulkEditModal.tsx (1 replacement)
   ✅ Line 218: dateOnly
      - `new Date(newDate).toLocaleDateString()`
      + `formatForUser(newDate, 'dateOnly', userRegion)`

### 📄 src/components/admin/ContentAuditLogModal.tsx (2 replacements)
   ✅ Line 136: datetime
      - `new Date(log.created_at).toLocaleDateString()`
      + `formatForUser(log.created_at, 'datetime', userRegion)`
   
   ✅ Line 139: datetime
      - `new Date(log.created_at).toLocaleTimeString()`
      + `formatForUser(log.created_at, 'datetime', userRegion)`

### 📄 src/components/admin/ContentSearchTable.tsx (1 replacement)
   ✅ Line 112: datetime
      - `new Date(dateString).toLocaleDateString()`
      + `formatForUser(dateString, 'datetime', userRegion)`

### 📄 src/components/admin/ContentSuggestionsPanel.tsx (2 replacements)
   ✅ Line 76: dateOnly
      - `new Date(suggestion.suggested_value.date).toLocaleDateString()`
      + `formatForUser(suggestion.suggested_value.date, 'dateOnly', userRegion)`
   
   ✅ Line 226: datetime
      - `new Date(suggestion.created_at).toLocaleDateString()`
      + `formatForUser(suggestion.created_at, 'datetime', userRegion)`

### 📄 src/components/admin/DigestHistoryModal.tsx (2 replacements)
   ✅ Line 42: datetime
      - `new Date(digestSend.sent_at).toLocaleDateString()`
      + `formatForUser(digestSend.sent_at, 'datetime', userRegion)`
   
   ✅ Line 45: datetime  
      - `new Date(digestSend.sent_at).toLocaleTimeString()`
      + `formatForUser(digestSend.sent_at, 'datetime', userRegion)`

### 📄 src/components/admin/DigestPreviewModal.tsx (1 replacement)
   ✅ Line 67: datetime
      - `new Date(preview.generated_at).toLocaleDateString()`
      + `formatForUser(preview.generated_at, 'datetime', userRegion)`

### 📄 src/components/admin/DigestScheduler.tsx (3 replacements)
   ✅ Line 198: datetime
      - `new Date(settings.last_sent_at || '').toLocaleDateString()`
      + `formatForUser(settings.last_sent_at, 'datetime', userRegion)`
   
   ✅ Line 245: datetime
      - `new Date(history[0]?.sent_at || '').toLocaleDateString()`  
      + `formatForUser(history[0]?.sent_at, 'datetime', userRegion)`

### 📄 src/components/admin/FamilyOverviewTable.tsx (4 replacements)
   ✅ Line 156: relative
      - `formatDistanceToNow(new Date(family.created_at), { addSuffix: true })`
      + `formatForUser(family.created_at, 'relative', userRegion)`
   
   ✅ Line 167: relative
      - `formatDistanceToNow(new Date(family.last_activity_at), { addSuffix: true })`
      + `formatForUser(family.last_activity_at, 'relative', userRegion)`
   
   ✅ Line 189: datetime
      - `new Date(family.created_at).toLocaleDateString()`
      + `formatForUser(family.created_at, 'datetime', userRegion)`

### 📄 src/components/admin/QuarterlyAccessReview.tsx (6 replacements)
   ✅ Line 89: datetime
      - `format(new Date(access.granted_at), 'MMM dd, yyyy')`
      + `formatForUser(access.granted_at, 'datetime', userRegion)`
   
   ✅ Line 95: relative
      - `formatDistanceToNow(new Date(access.last_activity_at), { addSuffix: true })`
      + `formatForUser(access.last_activity_at, 'relative', userRegion)`
   
   🚨 Line 102: datetime  
      - `format(new Date(access.revoked_at), 'MMM dd, yyyy')`
      + `formatForUser(access.revoked_at, 'datetime', userRegion) /* TODO: Review format: MMM dd, yyyy */`

### 📄 src/components/people/Contributions.tsx (3 replacements)
   ✅ Line 67: relative
      - `formatDistanceToNow(new Date(story.created_at), { addSuffix: true })`
      + `formatForUser(story.created_at, 'relative', userRegion)`
   
   ✅ Line 89: relative
      - `formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })`
      + `formatForUser(comment.created_at, 'relative', userRegion)`

### 📄 src/components/people/PersonTimeline.tsx (8 replacements)
   ✅ Line 145: datetime
      - `new Date(item.created_at).toLocaleDateString()`
      + `formatForUser(item.created_at, 'datetime', userRegion)`
   
   ✅ Line 189: dateOnly
      - `new Date(item.occurred_on).toLocaleDateString()`
      + `formatForUser(item.occurred_on, 'dateOnly', userRegion)`
   
   🚨 Line 234: dateOnly
      - `format(parseISO(item.happened_on), 'MMMM dd, yyyy')`
      + `formatForUser(item.happened_on, 'dateOnly', userRegion) /* TODO: Review format: MMMM dd, yyyy */`

### 📄 src/lib/timelineBuckets.ts (4 replacements)
   ⚠️ Line 75: dateOnly
      - `new Date(bucketDate).getFullYear()`
      + `/* Keep - this is internal date calculation, not UI formatting */`
   
   ⚠️ Line 89: dateOnly
      - `labelFor(new Date(item.happened_on), zoom)`
      + `/* Keep - internal bucketing logic */`

---

## 🚨 High Priority Files (low confidence replacements):

These files need **manual review** after codemod application:

- **src/components/StoryCard.tsx** - Complex date format options
- **src/components/admin/QuarterlyAccessReview.tsx** - Specific date format requirements  
- **src/components/people/PersonTimeline.tsx** - Multiple date-fns format calls
- **src/components/admin/AuditLogViewer.tsx** - Precise timestamp formatting
- **src/lib/digestTypes.ts** - Date validation and processing
- **src/components/pets/PetForm.tsx** - Form date handling
- **src/components/story-wizard/steps/StoryWizardStep2.tsx** - User input processing

## 🔧 Required Manual Changes

### 1. Import Additions (43 files)
Each modified file needs:
```typescript
import { formatForUser, getCurrentUserRegion } from '@/utils/date'

// Add at component start:
const userRegion = getCurrentUserRegion()
```

### 2. User Region Context  
Consider creating a React context for user region preferences:
```typescript
const UserRegionContext = createContext<RegionPrefs>(DEFAULT_REGION)
```

### 3. Special Cases to Review

#### Date Calculations vs Display
Some `new Date()` usage is for calculations, not display:
- Sorting: `new Date(a.created_at).getTime() - new Date(b.created_at).getTime()` ✅ Keep
- Comparisons: `new Date(activity.created_at) > oneDayAgo` ✅ Keep  
- Display: `new Date(story.created_at).toLocaleDateString()` ❌ Replace

#### Number Formatting vs Date Formatting  
- `stage.count.toLocaleString()` ✅ Keep (number formatting)
- `new Date().toLocaleString()` ❌ Replace (date formatting)

#### Internal Utils vs UI Components
- `src/lib/timelineBuckets.ts` - Keep internal date math
- `src/utils/dateUtils.ts` - Already deprecated, keep compatibility
- UI components - Replace all display formatting

## 📋 Post-Codemod Checklist

- [ ] Run ESLint to catch missed patterns
- [ ] Update component tests for new formatting  
- [ ] Test timezone switching functionality
- [ ] Verify birthday dates don't shift
- [ ] Check relative time accuracy
- [ ] Review low-confidence replacements manually
- [ ] Update Storybook stories if applicable
- [ ] Test CI pipeline with new ESLint rules

## 🚀 Execution Plan

```bash
# 1. Run dry run to review
npx tsx scripts/codemod-date-formatting.ts

# 2. Apply automatic replacements  
npx tsx scripts/codemod-date-formatting.ts --fix

# 3. Enable ESLint rule enforcement
npm run lint:fix -- --config .eslintrc.codemod.js

# 4. Manual review of flagged files
# Review files listed in "High Priority Files" section

# 5. Test suite validation
npm run test
npm run type-check
```

---

*Codemod generated on $(date) - Review carefully before applying*