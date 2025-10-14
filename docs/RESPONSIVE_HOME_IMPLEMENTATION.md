# Responsive Home Implementation

## Overview
Implemented fully responsive Home V2 experience with sticky controls, mobile-optimized layouts, and a collapsible Tools drawer.

## Key Features

### 1. Sticky Header
- TopBar component sticks to top on scroll
- Maintains access to search, notifications, and quick actions
- Responsive layout that adapts to mobile/tablet/desktop

### 2. Hero Tiles Responsive Behavior
- **Mobile (< 640px)**: Vertical stack of cards, full-width
- **Tablet/Desktop (≥ 640px)**: Horizontal scroll with smooth snap behavior
- Enhanced hover animations and touch-friendly active states
- Smooth scroll with snap points for better UX

### 3. Feed Layout
- Single column on mobile
- Two-column layout on large screens (feed + right rail)
- Responsive grid: `grid-cols-1 lg:grid-cols-[minmax(0,680px)_320px]`

### 4. Right Rail → Mobile Tools Drawer
- Desktop (≥ 1024px): Sticky right rail with widgets
- Mobile (< 1024px): Hidden, accessible via floating action button
- Floating button positioned at `bottom-6 right-6` with shadow
- Sheet drawer slides in from right with full widget access

### 5. Deep Link Support
- `?panel=tools` URL parameter opens Tools drawer
- State syncs with URL:
  - Opening drawer adds `?panel=tools`
  - Closing drawer removes parameter
- Allows direct linking to Tools panel

### 6. Left Navigation Sidebar
- Collapsible sidebar with icon-only mode
- Active route highlighting via NavLink
- Full keyboard navigation support
- Sections: Personal, Family, SafeBox
- Routes:
  - My Timeline → `/me/timeline`
  - People → `/people`
  - Albums → `/albums`
  - Objects → `/objects`
  - Recipes → `/recipes`
  - Properties → `/properties`
  - Pets → `/pets`
  - Family Tree → `/tree`
  - Vault → `/vault`

## Components Modified

### HomeV2.tsx
- Added Tools drawer state management
- URL parameter handling for `?panel=tools`
- Floating action button for mobile
- Sheet component integration

### TopBar.tsx
- Removed redundant sticky positioning (handled by parent)
- Improved responsive padding and truncation
- Enhanced accessibility labels

### HeroStrip.tsx
- Added smooth scroll and snap behavior
- Enhanced hover/active animations
- Touch-friendly transitions

### LeftNav.tsx (new)
- Collapsible sidebar navigation
- Active route highlighting
- Grouped navigation sections

### AppLayout.tsx (new)
- SidebarProvider wrapper
- Optional header display
- Flexible layout composition

## Responsive Breakpoints
- Mobile: `< 640px` (sm)
- Tablet: `640px - 1024px` (sm to lg)
- Desktop: `≥ 1024px` (lg)

## Accessibility
- All interactive elements have ARIA labels
- Keyboard navigation fully supported
- Focus states visible
- Screen reader friendly

## Performance Optimizations
- Sticky positioning with CSS (hardware accelerated)
- Smooth scroll with `scroll-smooth` utility
- Hidden scrollbars with `scrollbar-hide` utility
- Optimized animations with `transition-all duration-200`
- Single column layout reduces DOM complexity on mobile

## Testing Checklist
- [x] Header remains sticky on scroll
- [x] Hero tiles scroll horizontally on tablet/desktop
- [x] Feed collapses to single column on mobile
- [x] Tools drawer opens/closes correctly
- [x] Deep link `?panel=tools` works
- [x] All navigation routes functional
- [x] Keyboard navigation works
- [x] Touch interactions smooth on mobile
- [ ] Lighthouse mobile score ≥ 95

## Usage

### Opening Tools Drawer Programmatically
```typescript
navigate('/home?panel=tools')
```

### Accessing Tools Drawer State
```typescript
const [searchParams] = useSearchParams()
const isPanelOpen = searchParams.get('panel') === 'tools'
```

## Future Enhancements
- Add gesture support for drawer (swipe to open/close)
- Implement drawer position persistence
- Add animation presets for smoother transitions
- Consider virtual scrolling for very long feeds
