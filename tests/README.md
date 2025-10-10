# E2E Tests for Simple Mode

This directory contains Playwright E2E tests for the Simple Mode story creation flows.

## Test Files

- **stories_text.spec.ts**: Tests for creating text stories
- **stories_photo.spec.ts**: Tests for uploading photos and creating photo stories
- **stories_voice.spec.ts**: Tests for voice recording and audio upload
- **drafts.spec.ts**: Tests for draft auto-save and recovery

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

The following `data-testid` attributes are used across the story creation forms:

- `story-title-input` - Story title input field
- `story-content-input` - Story content textarea
- `family-select-{id}` - Family picker buttons (when multiple families)
- `photo-input` - Photo file input
- `voice-upload-input` - Voice audio file input
- `publish-button` - Publish story button
- `save-draft-button` - Save as draft button
- `story-card` - Story card in feed
- `photo-preview` - Photo preview thumbnails

## Test Environment

Tests expect:
- A running development server at `http://localhost:5173`
- A test user with credentials:
  - Email: `test@example.com`
  - Password: `TestPassword123!`
- At least one family for the test user

## Notes

- Tests will create real stories in the database during execution
- Each test run generates unique timestamps to avoid conflicts
- Tests clean up after themselves where possible
- Microphone tests may behave differently based on browser permissions
