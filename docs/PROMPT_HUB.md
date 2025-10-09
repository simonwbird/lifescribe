# Prompt Hub Documentation

## Overview
The Prompt Hub is a centralized discovery interface for family story prompts with filtering, categorization, and a new-user onboarding experience.

## Features

### 1. Tabs
Three main views for organizing prompts:
- **All**: Shows all prompts regardless of status
- **Open**: Shows prompts that haven't been started
- **Completed**: Shows prompts the user has already responded to

### 2. Filters
Category-based filtering system:
- **People**: Prompts about specific family members
- **Places**: Prompts about locations and properties
- **Firsts**: First-time experiences and milestones
- **Food**: Recipes and food-related memories
- **Objects**: Important belongings and heirlooms

Each filter shows a count badge indicating how many prompts match.

### 3. Starter Pack (New User Onboarding)

**Criteria**: Shows for users within their first 7 days

**Features**:
- Displays 3 curated "Firsts" prompts
- Carousel navigation with progress tracking
- Visual completion indicators
- Completion celebration when all 3 are done
- Auto-dismisses after completion

**Analytics Events**:
- `starter_pack_begin`: Fired when Starter Pack first shown
- `starter_pack_complete`: Fired when all 3 prompts completed
- `starter_pack_prompt_clicked`: Fired when user clicks a starter prompt

**State Management**:
- Completed prompts stored in localStorage per user
- Key: `starter_pack_completed_{userId}`
- Persists across sessions

### 4. Navigation

**Primary Routes**:
- `/prompts/hub` - Main Prompt Hub page
- `/prompts/hub?tab=open` - Direct link to Open tab
- `/prompts/hub?tab=completed` - Direct link to Completed tab

**Entry Points**:
- Header "Stories" navigation link
- "Browse All Prompts" buttons throughout the app
- Simple Mode header

## Components

### PromptHub.tsx
Main page component with tabs, filters, and Starter Pack integration.

**Props**: None (uses URL params for tab state)

**Key Features**:
- Detects new users (< 7 days) automatically
- Responsive grid layout (1/2/3 columns)
- Real-time prompt counts in tab badges
- Filter state management
- Analytics tracking for all interactions

### StarterPack.tsx
Onboarding carousel for new users.

**Props**:
```typescript
interface StarterPackProps {
  prompts: PromptInstance[]
  completedPrompts: Set<string>
  onComplete: (promptId: string) => void
}
```

**Features**:
- Progress bar with clickable segments
- Keyboard-accessible navigation
- Completion animation
- Automatic analytics tracking

### PromptFilters.tsx
Reusable filter component.

**Props**:
```typescript
interface PromptFiltersProps {
  activeFilter: PromptFilter
  onFilterChange: (filter: PromptFilter) => void
  counts?: Record<string, number>
}
```

**Filter Types**:
```typescript
type PromptFilter = 'people' | 'places' | 'firsts' | 'food' | 'objects' | null
```

## Analytics Events

All events are tracked to the `analytics_events` table:

```typescript
// Starter Pack Events
'starter_pack_begin' - When Starter Pack first shown
  - Properties: { prompt_count: number }

'starter_pack_complete' - When all starter prompts done
  - Properties: { prompts_completed: number, time_to_complete: number }

'starter_pack_prompt_clicked' - When user clicks a starter prompt
  - Properties: { prompt_id, prompt_index, prompt_title }

// Prompt Hub Events
'prompt_hub_tab_changed' - When switching tabs
  - Properties: { tab: 'all' | 'open' | 'completed' }

'prompt_hub_prompt_clicked' - When clicking any prompt
  - Properties: { prompt_id, prompt_title, prompt_category, tab, filter }
```

## Integration Points

### With StoryWizard
When a prompt is clicked, user is navigated to:
```
/stories/new?type=text&promptTitle=...&prompt_id=...&prompt_text=...&is_starter=true
```

The `is_starter=true` parameter allows StoryWizard to auto-mark the prompt as complete when published.

### With usePrompts Hook
Fetches all prompt instances with:
- Status filtering (open, in_progress, completed)
- Category detection from tags
- Real-time counts

### Filter Logic
Prompts are categorized by:
1. Checking `prompt.category` field (case-insensitive)
2. Checking `prompt.tags` array for related keywords
3. Mapping to one of 5 filter categories

## Usage Examples

### Linking to Specific Tab
```tsx
<Link to="/prompts/hub?tab=completed">View Completed</Link>
```

### Filtering Prompts Programmatically
```tsx
import { PromptFilters } from '@/components/prompts/PromptFilters'

function MyComponent() {
  const [filter, setFilter] = useState<PromptFilter>(null)
  
  return (
    <PromptFilters
      activeFilter={filter}
      onFilterChange={setFilter}
      counts={{ people: 12, places: 5, firsts: 8 }}
    />
  )
}
```

### Checking New User Status
```tsx
const userCreatedAt = new Date(user.created_at)
const daysSinceCreation = (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
const isNewUser = daysSinceCreation < 7
```

## Best Practices

1. **Always track analytics** for user actions in the Hub
2. **Update filter counts** when prompts change
3. **Persist starter pack progress** to localStorage
4. **Clear starter pack localStorage** when user completes onboarding
5. **Use query params** for shareable tab links

## Future Enhancements

- [ ] Search within prompts
- [ ] Sort options (date, popularity, category)
- [ ] Custom starter pack selection
- [ ] Prompt preview modal
- [ ] Bulk mark as complete
- [ ] Prompt scheduling and reminders
- [ ] Social proof (X family members completed this)
