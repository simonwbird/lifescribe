# Canonical Routes Implementation

## Overview
Centralized route management with type-safe builders and consistent deep-linking for the entire application.

## Location
`src/lib/routes.ts`

## Key Features

### 1. Type-Safe Story Tabs
```typescript
export type StoryTab = 'text' | 'photo' | 'voice' | 'video' | 'mixed'

// Validate tab from URL params
const tab = isStoryTab(rawTab) ? rawTab : 'text'
```

### 2. Safe URL Param Parsing
```typescript
// Parse composer params from any URL or URLSearchParams
const { tab, promptId, personId, children, circle, album, source } = 
  parseTabParam(location.search)
```

### 3. Canonical Route Builders
All navigation uses `routes.*` builders:

```typescript
import { routes } from '@/lib/routes'

// Simple routes
routes.home()                    // → /home
routes.drafts()                  // → /drafts
routes.vault()                   // → /vault

// Entity routes
routes.people('123')             // → /people/123
routes.eventShow('456')          // → /events/456
routes.storiesShow('789')        // → /stories/789

// Composer with options
routes.storyNew({
  tab: 'photo',
  promptId: 'abc',
  album: 'vacation',
  source: 'suggestion'
})
// → /stories/new?tab=photo&promptId=abc&album=vacation&source=suggestion

// Recipes with prefill
routes.recipesNew('grandmother')  
// → /recipes/new?prefill=grandmother
```

## Usage Across Components

### Navigation
```typescript
// src/components/navigation/LeftNav.tsx
const navItems = [
  { title: 'My Timeline', url: routes.meTimeline() },
  { title: 'People', url: routes.peopleIndex() },
  { title: 'Albums', url: routes.albumsIndex() },
  // ...
]
```

### Top Bar Quick Add
```typescript
// src/components/home/TopBar.tsx
<DropdownMenuItem onClick={() => {
  const route = routes.storyNew({ tab: 'photo' })
  track('nav_quick_add_open', { item: 'capture_photo', route })
  navigate(route)
}}>
  Capture Photo
</DropdownMenuItem>
```

### Hero Tiles
```typescript
// src/components/home/HeroStrip.tsx
{
  id: 'photo',
  title: 'Add Photo',
  action: () => {
    const destination = routes.storyNew({ tab: 'photo' })
    track('hero_tile_click', { tile_name: 'photo', destination })
    navigate(destination)
  }
}
```

### Right Rail Widgets
```typescript
// Any widget component
<Button onClick={() => {
  const destination = routes.analyticsCapturesWeek()
  track('right_rail_click', { 
    widget: 'captures', 
    destination 
  })
  navigate(destination)
}}>
  View This Week's Captures
</Button>
```

## Deep Link Examples

### Story Composer Deep Links
```typescript
// Voice recording with prompt
routes.storyNew({ 
  tab: 'voice', 
  promptId: 'first-pet',
  source: 'suggestion' 
})
// → /stories/new?tab=voice&promptId=first-pet&source=suggestion

// Photo album upload
routes.storyNew({ 
  tab: 'photo', 
  album: 'last-event',
  source: 'suggestion' 
})
// → /stories/new?tab=photo&album=last-event&source=suggestion

// Story about specific person
routes.storyNew({ 
  tab: 'text',
  personId: '123',
  source: 'timeline'
})
// → /stories/new?tab=text&personId=123&source=timeline

// Story with multiple people tagged
routes.storyNew({ 
  tab: 'photo',
  children: ['person-1', 'person-2', 'person-3']
})
// → /stories/new?tab=photo&children=person-1,person-2,person-3
```

### Analytics Deep Links
```typescript
routes.analyticsCapturesWeek()
// → /analytics/captures?range=this-week

routes.searchOrphan()
// → /search?has=orphan

routes.searchUntaggedFaces()
// → /search?has=untagged_faces
```

### Admin & Research Deep Links
```typescript
routes.adminDataHealth()
// → /admin/data-health

routes.adminMergePeople()
// → /admin/merge?type=people

routes.researchCitations()
// → /research/citations?status=uncited
```

## Benefits

### 1. Single Source of Truth
- All routes defined in one file
- No scattered hardcoded URLs
- Easy to refactor and maintain

### 2. Type Safety
- TypeScript catches invalid tab values
- Autocomplete for all route options
- Compile-time route validation

### 3. Consistent Analytics
```typescript
// Every navigation automatically includes correct route
const destination = routes.storyNew({ tab: 'photo' })
track('hero_tile_click', { 
  tile_name: 'photo', 
  destination  // Always correct, always tracked
})
navigate(destination)
```

### 4. Safe Param Parsing
```typescript
// URL: /stories/new?tab=invalid&promptId=123

const { tab, promptId } = parseTabParam(location.search)
// tab = 'text' (fallback to safe default)
// promptId = '123' (preserved)
```

### 5. Deep Link Composability
```typescript
// Build complex URLs with all options
const link = routes.storyNew({
  tab: 'voice',
  promptId: suggestion.id,
  source: 'home_suggestion',
  circle: 'family'
})

// Share via email, social, QR code, etc.
const shareUrl = `${window.location.origin}${link}`
```

## Migration Checklist

### Components Updated
- [x] src/components/navigation/LeftNav.tsx
- [x] src/components/home/TopBar.tsx
- [x] src/components/home/HeroStrip.tsx
- [ ] src/components/home/Suggestions.tsx
- [ ] src/components/home/ThisWeeksCaptures.tsx
- [ ] src/components/vault/VaultProgressMeter.tsx
- [ ] src/components/admin/DataHealthDashboard.tsx
- [ ] src/components/citations/UncitedStoriesWidget.tsx
- [ ] src/components/home/Upcoming.tsx

### Verification Steps
1. [ ] All hardcoded `/stories/new` replaced with `routes.storyNew()`
2. [ ] All `/events/new` replaced with `routes.eventNew()`
3. [ ] All `/people/123` replaced with `routes.people(id)`
4. [ ] Tab params validated with `isStoryTab()`
5. [ ] Analytics tracking includes `destination` from route builder
6. [ ] Deep links tested with all param combinations
7. [ ] URL params parsed safely in composer components

## Future Enhancements

### 1. Route Guards
```typescript
// Add authentication checks
export const protectedRoute = (path: string) => {
  if (!isAuthenticated()) return routes.login()
  return path
}
```

### 2. Route History
```typescript
// Track user navigation paths
export const trackRouteChange = (from: string, to: string) => {
  analytics.track('route_change', { from, to })
}
```

### 3. Internationalization
```typescript
// Localized routes
export const routes = (locale: string) => ({
  home: () => `/${locale}/home`,
  // ...
})
```

### 4. Route Preloading
```typescript
// Prefetch data for routes
export const preloadRoute = async (route: string) => {
  const data = await fetchRouteData(route)
  cache.set(route, data)
}
```
