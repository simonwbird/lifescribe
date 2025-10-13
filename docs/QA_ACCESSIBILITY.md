# QA & Accessibility Implementation

## Overview
This document outlines the QA testing scenarios and accessibility features implemented for the story creation flow.

## QA Testing Scenarios

### 1. Tab Switching Without Loss ✅
- **Implementation**: `useDraftManager` with autosave every 10s
- **Test**: Switch between tabs/browsers, data persists via localStorage and database
- **Recovery**: Draft recovery modal on page load if draft exists

### 2. Large Video Upload ✅
- **Max Size**: 500MB
- **Validation**: `validateVideoFile()` in `utils/fileValidation.ts`
- **Formats**: MP4, WebM, QuickTime
- **Feedback**: Upload progress indicator, error toasts for invalid files

### 3. Front/Back Camera Capture ✅
- **Implementation**: Video/Photo panels with camera selection
- **Browser API**: Uses `navigator.mediaDevices.getUserMedia()`
- **Fallback**: File upload if camera access denied

### 4. EXIF Date Suggestion ✅
- **Implementation**: `PhotoPanel` extracts EXIF date from first image
- **UX**: Alert prompt asking user to apply photo date
- **Utility**: `utils/exifUtils.ts`

### 5. Fuzzy Date Support ✅
- **Implementation**: `StoryWizardStep2` supports approximate dates
- **Options**: Exact date, approximate (year/month), circa
- **Database**: `occurred_on`, `occurred_precision`, `is_approx` fields

### 6. Person Filter ✅
- **Implementation**: `PeoplePicker` component
- **Features**: Search, multi-select, role assignment
- **Database**: `person_story_links` with roles

### 7. Publish States ✅
- **States**: draft, published
- **Validation**: Required fields checked before publish
- **Feedback**: Loading states, success/error toasts
- **Database**: Stories marked with `status` field

## Accessibility Features

### 1. Input Labels & ARIA ✅
**All form inputs have:**
- Explicit `<label>` with `htmlFor` matching input `id`
- `aria-required="true"` for required fields
- `aria-invalid` for validation state
- `aria-describedby` linking to hint/error text
- Screen-reader-only hints via `sr-only` class

**Example:**
```tsx
<label htmlFor="title">
  Title <span className="text-destructive" aria-label="required">*</span>
</label>
<Input
  id="title"
  aria-required="true"
  aria-invalid={!title.trim()}
  aria-describedby="title-hint"
/>
<span id="title-hint" className="sr-only">
  Enter a title for your story, up to 200 characters
</span>
```

### 2. Focus Order ✅
- Natural tab order follows visual layout
- Modal focus trap when dialogs open
- Focus returns to trigger element on modal close
- Skip links available (main navigation)

### 3. ARIA Live Regions ✅
**Autosave Indicator:**
- `role="status"` with `aria-live="polite"`
- Announces save state changes to screen readers
- Visual + auditory feedback

**Character Counter:**
- `aria-live="polite"` on character count
- Updates announced without interrupting user

**Progress Indicator:**
- `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Step navigation uses `<nav>` with `aria-label`
- Current step marked with `aria-current="step"`

### 4. Keyboard Navigation ✅

**Global Shortcuts:**
- `Tab` / `Shift+Tab`: Navigate fields
- `Enter`: Submit/Continue (when not in text field)
- `Escape`: Cancel/Close modals
- `Ctrl/Cmd + S`: Manual save
- `Ctrl/Cmd + Enter`: Quick submit

**Implementation:**
- `useKeyboardShortcuts` hook in `hooks/useKeyboardShortcuts.ts`
- Context-aware (doesn't interfere with text input)
- Keyboard hints shown on first visit

**Reorderable Lists:**
- Drag-and-drop with keyboard alternative
- Arrow keys + Enter to reorder
- Screen reader announcements for position changes

### 5. Color Contrast ✅
- All text meets WCAG AA standards (4.5:1 minimum)
- Error states use both color AND icons
- Focus indicators have 3:1 contrast minimum
- Design system enforces accessible color tokens

### 6. Screen Reader Optimization ✅
- Semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`)
- Descriptive button text (no "Click here")
- Image alt text for all media
- Form error messages announced
- Loading states announced

## Testing Tools

### Automated Testing
```bash
# Run accessibility tests
npm run test:a11y

# Lighthouse audit
npm run lighthouse
```

### Manual Testing Checklist
- [ ] Tab through entire form - logical order
- [ ] Submit with invalid data - errors announced
- [ ] Use screen reader (NVDA/JAWS/VoiceOver)
- [ ] Test with keyboard only (no mouse)
- [ ] Test with high contrast mode
- [ ] Test with zoom at 200%
- [ ] Verify ARIA attributes in DevTools

### Browser Testing
- Chrome (latest) ✅
- Firefox (latest) ✅
- Safari (latest) ✅
- Edge (latest) ✅
- Mobile Safari (iOS) ✅
- Chrome Mobile (Android) ✅

## Lighthouse Scores Target

| Metric | Target | Status |
|--------|--------|--------|
| Performance | ≥90 | ✅ |
| Accessibility | ≥90 | ✅ |
| Best Practices | ≥90 | ✅ |
| SEO | ≥90 | ✅ |

## Known Limitations

1. **File Upload Progress**: Visual only, not announced to screen readers
2. **Image Editing**: Some canvas operations not keyboard-accessible
3. **Voice Recording**: Requires microphone, no transcript-only alternative yet

## Future Improvements

- [ ] More granular keyboard shortcuts
- [ ] Voice commands for hands-free operation
- [ ] Haptic feedback on mobile
- [ ] Undo/redo with keyboard shortcuts
- [ ] Autosave conflict resolution UI
