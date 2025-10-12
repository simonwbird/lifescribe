# Person Page Tests

## Overview

This test suite validates the Person Page layout system, ensuring:
- No duplicate blocks across breakpoints
- Proper semantic HTML and accessibility
- Stable anchor IDs for navigation
- Correct visual placement at each breakpoint

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test File
```bash
npx playwright test tests/person-page-no-duplicates.spec.ts
```

### With UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Generate Screenshots
```bash
npx playwright test --update-snapshots
```

## Test Coverage

### 1. Unique Blocks Across Breakpoints
**File:** `person-page-no-duplicates.spec.ts`

Verifies each block appears exactly once at:
- Desktop (1440x900)
- Tablet (768x1024)
- Mobile (375x667)

**Blocks tested:**
- Content: Hero, Bio, Timeline, Stories, Photos, Audio, Relationships, Guestbook
- Widgets: QuickFacts, TOC, ContributeCTA, Anniversaries, VisibilitySearch, MiniMap, MediaCounters, FavoritesQuirks, Causes, ShareExport

### 2. Visual Placement
Checks that:
- **Desktop/Tablet:** Rail is visible, QuickFacts appears in sidebar
- **Mobile:** Rail is hidden, QuickFacts appears after Bio and before Timeline

### 3. Anchor Navigation
Verifies:
- TOC links work and jump to correct sections
- URL hash updates correctly
- Smooth scrolling functions properly

### 4. Accessibility
Validates:
- Main landmark exists with `role="main"`
- Complementary landmark for sidebar
- Sections have proper ARIA labels
- Main element is focusable (`tabindex="-1"`) for skip link
- Scroll margin offset for fixed header

### 5. Singleton Enforcement
Confirms widget blocks (marked `singleton: true`) never appear more than once.

## Expected Results

✅ **Pass Criteria:**
- All blocks appear exactly once per breakpoint
- Visual placement matches specification
- Anchor links navigate correctly
- ARIA landmarks present and correct
- Zero duplicate IDs in DOM

❌ **Fail Scenarios:**
- Any block appears more than once
- QuickFacts not in rail on desktop
- Rail visible on mobile
- Missing ARIA landmarks
- Broken anchor navigation

## Screenshots

Tests automatically generate screenshots in `tests/screenshots/`:
- `person-page-desktop.png`
- `person-page-tablet.png`
- `person-page-mobile.png`

Use these for visual regression testing.

## Debugging

### View Test Results
```bash
npx playwright show-report
```

### Run in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Debug Specific Test
```bash
npx playwright test --debug person-page-no-duplicates
```

### Console Logs
Tests log detailed information:
```
[desktop] Block counts: { bio: 1, quick-facts: 1, ... }
[desktop] ✓ QuickFacts in rail
[desktop] ✓ Jump to Photos works
[desktop] ✅ All checks passed
```

## Common Issues

### "Element not found"
- Page may not have fully loaded. Increase `waitForTimeout` values.
- Block may not exist for test person. Check person data fixtures.

### "Duplicate blocks found"
- **Root cause:** PortalLayoutManager rendering logic issue
- **Check:** BlockValidator in `src/lib/blockRegistry.ts`
- **Debug:** Look for blocks in both `layoutMap.main` and `layoutMap.rail`

### "Rail not visible on desktop"
- **Root cause:** CSS grid not applying correctly
- **Check:** Viewport size matches breakpoint definition
- **Debug:** Inspect computed styles on `#portal-rail`

### "Anchor navigation fails"
- **Root cause:** Section IDs missing or incorrect
- **Check:** BlockRegistry anchor IDs match block IDs in DOM
- **Debug:** Run `console.log(document.querySelectorAll('[id]'))` in browser

## Continuous Integration

Add to CI pipeline:
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Screenshots
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-screenshots
    path: tests/screenshots/
```

## Related Documentation

- Architecture: `src/components/person-page/ARCHITECTURE.md`
- Block Registry: `src/lib/blockRegistry.ts`
- Portal Layout Manager: `src/components/person-page/PortalLayoutManager.tsx`
