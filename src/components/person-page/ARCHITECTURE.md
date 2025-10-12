# Person Page Architecture - SEO & Accessibility

## Overview

The Person Page layout system uses React Portals and CSS Grid to enable responsive layouts while maintaining semantic HTML and accessibility standards.

## Key Principles

### 1. Semantic HTML Structure

Each block is rendered as a `<section>` with proper semantic attributes:

```tsx
<section
  id="bio"              // Stable anchor ID for jump links
  data-block-id="Bio"   // Internal tracking
  aria-label="Biography section"  // Screen reader label
  className="scroll-mt-20"  // Scroll offset for fixed header
>
  {component}
</section>
```

### 2. Logical DOM Order

Blocks appear in the DOM in a logical reading order, regardless of visual placement:

**DOM Order (Screen readers):**
1. Hero
2. Bio
3. QuickFacts
4. PinnedHighlights
5. Timeline
6. Stories
7. ... (remaining content blocks)
8. ... (remaining widget blocks)

**Visual Order (CSS Grid):**
- Desktop/Tablet: Main column + Right rail (side-by-side)
- Mobile: Single column (all blocks stacked)

### 3. Stable Anchor IDs

Each block has a permanent anchor ID defined in `blockRegistry.ts`:

```typescript
Bio: {
  id: 'Bio',
  anchorId: 'bio',      // Used for #bio anchor links
  ariaLabel: 'Biography section'
}
```

These IDs remain consistent across:
- All breakpoints (desktop, tablet, mobile)
- Layout customizations
- Theme changes

### 4. Landmarks and ARIA

```html
<main id="portal-main" role="main" aria-label="Main content" tabindex="-1">
  <!-- Content blocks -->
</main>

<aside id="portal-rail" role="complementary" aria-label="Sidebar widgets">
  <!-- Widget blocks -->
</aside>
```

The `tabindex="-1"` on main allows the skip link to focus it programmatically.

## Table of Contents (TOC)

The TOC widget (`TOCBlock.tsx`) automatically:
1. Detects visible sections by querying `document.getElementById(anchorId)`
2. Uses IntersectionObserver to highlight the active section
3. Provides keyboard navigation (Enter/Space to jump)
4. Updates URL hash for shareable links

Jump links work across all breakpoints because anchor IDs are stable.

## Skip to Content Link

The page includes a skip link at the top:

```tsx
<SkipLink href="#portal-main">Skip to main content</SkipLink>
```

This allows keyboard users to bypass navigation and jump directly to content.

## Singleton Enforcement

Widget blocks (QuickFacts, TOC, etc.) are marked as `singleton: true`:

```typescript
QuickFacts: {
  singleton: true,  // Can only appear once
  // ...
}
```

The `BlockValidator` prevents duplicates:
- First instance: Rendered normally
- Subsequent instances: Dropped with console error

## Responsive Behavior

### Desktop (≥1024px)
```
┌─────────────────────────────┐
│        Main (8 cols)        │  Rail (4 cols)
│  • Hero                     │  • QuickFacts
│  • Bio                      │  • PinnedHighlights
│  • Timeline                 │  • TOC
│  • Stories                  │  • ...
└─────────────────────────────┘
```

### Mobile (<1024px)
```
┌─────────────────────────────┐
│  • Hero
│  • Bio
│  • QuickFacts      ← Inserted after Bio
│  • PinnedHighlights
│  • TOC
│  • Timeline        ← Content continues
│  • Stories
└─────────────────────────────┘
```

## SEO Benefits

1. **Semantic HTML**: Search engines understand content structure
2. **Logical Source Order**: Main content appears early in DOM
3. **Stable URLs**: Anchor links work consistently (e.g., `/person/123#bio`)
4. **Meta Descriptions**: Each block has descriptive ARIA labels

## Accessibility Features

- ✅ Semantic landmarks (`<main>`, `<aside>`)
- ✅ Stable anchor IDs for jump links
- ✅ ARIA labels for screen readers
- ✅ Logical reading order in DOM
- ✅ Skip to content link
- ✅ Keyboard navigation in TOC
- ✅ Focus management for jump links
- ✅ Scroll offset for fixed headers (`scroll-mt-20`)

## Testing Checklist

### Screen Readers
- [ ] Sections announce in logical order (Hero → Bio → Timeline...)
- [ ] Each section has descriptive label
- [ ] Main and complementary landmarks are identified

### Keyboard Navigation
- [ ] Tab to skip link, Enter to jump to main
- [ ] Tab through TOC links, Enter to jump to sections
- [ ] Focus visible on all interactive elements

### Jump Links
- [ ] TOC links work on desktop
- [ ] TOC links work on tablet
- [ ] TOC links work on mobile
- [ ] URL updates with hash (e.g., `#bio`)
- [ ] Direct link with hash scrolls to correct section

### Lighthouse
- [ ] Accessibility score ≥ 95
- [ ] No duplicate IDs
- [ ] All ARIA attributes valid
- [ ] Semantic HTML structure

## Migration from Old System

The previous `PageLayoutManager` rendered blocks in visual order, which could cause:
- ❌ Screen readers announcing widgets before content
- ❌ Duplicate IDs when blocks moved between containers
- ❌ Broken jump links on mobile

The new `PortalLayoutManager` fixes these issues while maintaining visual flexibility.
