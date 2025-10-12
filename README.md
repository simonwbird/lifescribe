# Person Page - Layout System

A responsive, accessible person page layout system with singleton enforcement and comprehensive CI validation.

## Features

✅ **Single-Instance Blocks** - Each block renders exactly once per breakpoint
✅ **Responsive Layouts** - Desktop/Tablet rail + main, Mobile single column  
✅ **Semantic HTML** - Proper landmarks, ARIA labels, stable anchor IDs
✅ **Singleton Enforcement** - Widgets (QuickFacts, TOC) can only appear once
✅ **CI Guardrails** - Automated tests prevent duplicate blocks
✅ **Visual Customization** - Drag-and-drop layout editor
✅ **Migration Tools** - Safe cleanup of existing duplicates

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Run Tests
```bash
# Unit tests
npm run test:unit

# E2E tests (requires dev server)
npx playwright test

# Validate layouts
node scripts/validate-layout.mjs
node scripts/check-duplicate-anchors.mjs
```

## Architecture

### Block Registry
**File:** `src/lib/blockRegistry.ts`

Defines all available blocks with metadata:
- `id`: Unique identifier
- `type`: Block type string
- `singleton`: Whether block can only appear once
- `anchorId`: Stable anchor for jump links
- `ariaLabel`: Screen reader label

```typescript
QuickFacts: {
  id: 'QuickFacts',
  type: 'quick_facts',
  singleton: true,
  displayName: 'Quick Facts',
  category: 'widget',
  anchorId: 'quick-facts',
  ariaLabel: 'Quick facts sidebar'
}
```

### Portal Layout Manager
**File:** `src/components/person-page/PortalLayoutManager.tsx`

Renders blocks using React Portals:
- Enforces singleton rules via `BlockValidator`
- Maintains logical DOM order for screen readers
- Uses CSS Grid for visual placement
- Adds semantic HTML landmarks and ARIA attributes

### Layout Configuration
**File:** `src/config/personPageLayouts.ts`

Defines default block placement per breakpoint:

```typescript
export const DEFAULT_LAYOUT_MAP = {
  desktop: {
    main: ['Hero', 'Bio', 'Timeline', 'Stories'],
    rail: ['QuickFacts', 'TOC', 'MediaCounters']
  },
  tablet: {
    main: ['Hero', 'Bio', 'Timeline'],
    rail: ['QuickFacts', 'TOC']
  },
  mobile: {
    main: ['Hero', 'Bio', 'QuickFacts', 'Timeline'],
    rail: []
  }
}
```

## CI Pipeline

### Unit Tests
- Layout validation (no duplicates)
- Block registry validation (unique anchors)
- Singleton enforcement

### E2E Tests  
- Visual placement across breakpoints
- Anchor navigation functionality
- ARIA landmarks and accessibility

### Build Scripts
- Validate default layout configuration
- Check for duplicate anchor IDs
- Ensure proper structure

**See:** `docs/CI_GUARDRAILS.md` for full details

## Validation Rules

### ✅ Allowed
```typescript
// Same block at different breakpoints
desktop: { main: ['Bio'], rail: ['QuickFacts'] }
tablet:  { main: ['Bio'], rail: ['QuickFacts'] }
mobile:  { main: ['Bio', 'QuickFacts'], rail: [] }
```

### ❌ Not Allowed
```typescript
// Block in both main and rail
desktop: {
  main: ['Bio', 'QuickFacts'],
  rail: ['QuickFacts', 'TOC']  // ❌ QuickFacts duplicated
}

// Singleton appearing multiple times
desktop: {
  main: ['TOC'],
  rail: ['TOC']  // ❌ TOC is singleton
}
```

## Migration Tools

### Remove Existing Duplicates
1. Open Layout Editor (Customize → Layout)
2. Click "Preview Cleanup" to see what will be removed
3. Click "Remove Duplicates" to execute migration
4. Earlier blocks are kept, later ones hidden

### Manual Migration (Edge Function)
```bash
curl -X POST https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/migrate-remove-duplicate-blocks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"personId": "...", "familyId": "...", "dryRun": true}'
```

## Accessibility

- ✅ Semantic landmarks (`<main>`, `<aside>`)
- ✅ Stable anchor IDs for navigation
- ✅ ARIA labels on all sections
- ✅ Skip to content link
- ✅ Keyboard navigation support
- ✅ Screen reader friendly DOM order
- ✅ Focus management for jump links

## Documentation

- **Architecture:** `src/components/person-page/ARCHITECTURE.md`
- **CI Guardrails:** `docs/CI_GUARDRAILS.md`
- **Test Guide:** `tests/README.md`
- **Test Setup:** `tests/SETUP.md`

## Common Issues

### Duplicate Blocks Error
**Symptom:** CI fails with "Block appears in both main and rail"

**Fix:** Remove the duplicate from one location:
```typescript
// Before
desktop: { main: ['Bio', 'QuickFacts'], rail: ['QuickFacts'] }

// After
desktop: { main: ['Bio'], rail: ['QuickFacts'] }
```

### Singleton Violation
**Symptom:** Widget appears twice on page

**Fix:** Check layout map - singletons can only appear once per breakpoint.

### Jump Links Not Working
**Symptom:** TOC links don't scroll to sections

**Fix:** Verify anchor IDs match between `blockRegistry.ts` and rendered sections.

## Contributing

1. Run tests before committing:
   ```bash
   npm run test:unit
   npx playwright test
   ```

2. Validate layout changes:
   ```bash
   node scripts/validate-layout.mjs
   ```

3. Ensure CI passes before merging

## License

MIT
