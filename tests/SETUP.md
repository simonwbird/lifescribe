# Test Setup Instructions

## Installation

Playwright is already installed in this project. To ensure you have the browsers installed, run:

```bash
npx playwright install
```

## Running Tests

Since `package.json` is managed by the system, use these commands directly:

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/person-page-no-duplicates.spec.ts
```

### Run in UI mode (interactive)
```bash
npx playwright test --ui
```

### Run in headed mode (see browser)
```bash
npx playwright test --headed
```

### Debug a test
```bash
npx playwright test --debug
```

### Generate test report
```bash
npx playwright show-report
```

## Quick Start

1. **Install browsers** (first time only):
   ```bash
   npx playwright install chromium firefox webkit
   ```

2. **Run the Person Page test**:
   ```bash
   npx playwright test tests/person-page-no-duplicates.spec.ts
   ```

3. **View results**:
   - Screenshots will be in `tests/screenshots/`
   - HTML report: `npx playwright show-report`

## What Gets Tested

✅ **No Duplicate Blocks**
- Each block appears exactly once at each breakpoint
- Singleton enforcement works correctly

✅ **Visual Placement**
- Desktop: Rail visible with widgets
- Mobile: Rail hidden, widgets in main column in correct order

✅ **Accessibility**
- Semantic HTML landmarks (`<main>`, `<aside>`)
- ARIA labels on all sections
- Stable anchor IDs for navigation

✅ **Navigation**
- TOC jump links work across all breakpoints
- Anchor IDs remain stable when resizing

## Expected Output

```
[desktop] Block counts: { hero: 1, bio: 1, quick-facts: 1, ... }
[desktop] ✓ QuickFacts in rail
[desktop] ✓ Jump to Photos works
[desktop] ✅ All checks passed

[tablet] Block counts: { hero: 1, bio: 1, quick-facts: 1, ... }
[tablet] ✓ QuickFacts in rail
[tablet] ✅ All checks passed

[mobile] Block counts: { hero: 1, bio: 1, quick-facts: 1, ... }
[mobile] ✓ Rail hidden
[mobile] ✓ Bio before QuickFacts
[mobile] ✓ QuickFacts before Timeline
[mobile] ✅ All checks passed

✅ 6 passed (Xm Xs)
```

## Troubleshooting

### "Executable doesn't exist"
Run: `npx playwright install`

### "Address already in use"
Make sure dev server isn't already running on port 5173.

### Tests timeout
Increase timeout in the test file or run with:
```bash
npx playwright test --timeout=180000
```

### Screenshots not generated
Check `tests/screenshots/` directory is created. The test will create it automatically.

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npx playwright test

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
    
- name: Upload Screenshots
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: screenshots
    path: tests/screenshots/
```
