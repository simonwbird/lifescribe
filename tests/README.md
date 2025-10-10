# E2E Tests for Simple Mode & New Memory FAB

This directory contains Playwright E2E tests for the Simple Mode story creation flows and the New Memory FAB feature.

## Test Files

### Story Creation Tests
- **stories_text.spec.ts**: Tests for creating text stories
- **stories_photo.spec.ts**: Tests for uploading photos and creating photo stories
- **stories_voice.spec.ts**: Tests for voice recording and audio upload
- **drafts.spec.ts**: Tests for draft auto-save and recovery

### New Memory FAB Tests
- **new_memory_fab.spec.ts**: Tests for the floating action button and modal chooser

## Running Tests

### Prerequisites

Make sure you have test fixtures in place:
- `tests/fixtures/test-image.png` - A small test image
- `tests/fixtures/test-audio.mp3` - A short test audio file
- `tests/fixtures/test-file.txt` - A text file for validation testing

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test stories_text.spec.ts
npx playwright test new_memory_fab.spec.ts
```

### Run tests in headed mode (with browser UI)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### View test report
```bash
npx playwright show-report
```

## Test Data Attributes

### Story Creation Forms
- `story-title-input` - Story title input field
- `story-content-input` - Story content textarea
- `family-select-{id}` - Family picker buttons (when multiple families)
- `photo-input` - Photo file input
- `voice-upload-input` - Voice audio file input
- `publish-button` - Publish story button
- `save-draft-button` - Save as draft button
- `story-card` - Story card in feed
- `photo-preview` - Photo preview thumbnails

### New Memory FAB
- `new-memory-fab` - Floating action button on feed
- `new-memory-modal` - Modal dialog container
- `new-memory-option-text` - Text story option card
- `new-memory-option-photo` - Photo story option card
- `new-memory-option-voice` - Voice story option card
- `new-memory-family-select` - Family selector dropdown
- `new-memory-continue` - Continue button on each option

## Test Environment

Tests expect:
- A running development server at `http://localhost:5173`
- A test user with credentials:
  - Email: `test@example.com`
  - Password: `TestPassword123!`
- At least one family for the test user

## Features Tested

### New Memory FAB
- ✅ FAB visibility on feed page
- ✅ Modal open/close behavior
- ✅ ESC key closes modal
- ✅ Backdrop click closes modal
- ✅ Family selector for multiple families
- ✅ Navigation to text/photo/voice creation
- ✅ URL parameters (type and family_id)
- ✅ Keyboard navigation (Enter key)
- ✅ Keyboard shortcuts (T/P/V keys)
- ✅ LocalStorage persistence for last used family
- ✅ Mobile-friendly positioning
- ✅ Validation for family selection

### Story Creation
- ✅ Text story creation and display in feed
- ✅ Photo upload with multiple images
- ✅ Voice audio upload and fallback
- ✅ Draft auto-save and recovery
- ✅ Form validation
- ✅ Error handling

## Notes

- Tests will create real stories in the database during execution
- Each test run generates unique timestamps to avoid conflicts
- Tests clean up after themselves where possible
- Microphone tests may behave differently based on browser permissions
- The New Memory FAB is designed to be thumb-reachable on mobile devices
