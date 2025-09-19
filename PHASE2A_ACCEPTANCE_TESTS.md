# Phase 2A Acceptance Tests: Region Settings & Mismatch Banner

## 🎯 User Acceptance Tests

### UAT-1: Onboarding Region Detection
**Given**: New user starts onboarding  
**When**: User reaches step 5 (Region Settings)  
**Then**: 
- ✅ Browser locale is auto-detected (e.g., en-GB for UK users)
- ✅ Browser timezone is auto-detected (e.g., Europe/London)
- ✅ Country is inferred from locale/timezone  
- ✅ "Auto-detected from your browser" badge shows
- ✅ User can modify selections before continuing
- ✅ Preview shows dates in selected format
- ✅ Help text explains "Times show in your time zone. Birthdays never shift."

### UAT-2: Onboarding Region Persistence  
**Given**: User completes onboarding with custom region settings
**When**: User logs out and back in
**Then**:
- ✅ Selected region preferences are saved to database
- ✅ All dates throughout app use saved preferences
- ✅ Profile page shows correct region settings

### UAT-3: Profile Region Settings
**Given**: User navigates to Profile page
**When**: User views "Region & Format" section  
**Then**:
- ✅ Current locale, timezone, country are displayed
- ✅ Dropdowns show all supported locales and common timezones
- ✅ Timezone search/filter works correctly
- ✅ Custom date format field is optional
- ✅ Live preview shows: Birthday, Timestamp, Relative time
- ✅ Help text: "Times show in your time zone. Birthdays never shift."
- ✅ Auto-detect button updates to browser settings
- ✅ Save button persists changes

### UAT-4: Timezone Mismatch Detection
**Given**: User's device timezone differs from saved profile timezone  
**When**: User visits any page in the app
**Then**:
- ✅ Yellow warning banner appears at top of page
- ✅ Banner shows: "We noticed your device time zone differs from your profile"
- ✅ Banner displays both profile timezone and device timezone
- ✅ "Use Device Time Zone" button is present
- ✅ X button to dismiss banner is present

### UAT-5: Timezone Mismatch Switch
**Given**: Timezone mismatch banner is showing
**When**: User clicks "Use Device Time Zone" button  
**Then**:
- ✅ Button shows "Switching..." loading state
- ✅ Profile timezone updates to device timezone in database
- ✅ Banner disappears after successful update
- ✅ Success toast: "Timezone updated to [timezone name]"
- ✅ All dates re-render with new timezone immediately
- ✅ Profile page reflects new timezone setting

### UAT-6: Timezone Mismatch Dismiss
**Given**: Timezone mismatch banner is showing
**When**: User clicks X dismiss button
**Then**:
- ✅ Banner disappears for current session
- ✅ No database changes are made
- ✅ Banner will reappear on next page load/session

---

## 🔧 Technical Integration Tests

### TIT-1: Database Schema Validation
```sql
-- Test profile table has new columns
SELECT locale, timezone, country, date_format_preference 
FROM profiles LIMIT 1;

-- Test valid locale constraint
INSERT INTO profiles (locale) VALUES ('invalid-locale'); -- Should fail

-- Test valid timezone constraint  
INSERT INTO profiles (timezone) VALUES ('Invalid/Timezone'); -- Should fail

-- Test valid country constraint
INSERT INTO profiles (country) VALUES ('USA'); -- Should fail (not ISO 3166-1 alpha-2)
```

### TIT-2: Browser Detection API Tests
```typescript
// Test detection with various browser configurations
test('US browser detection', () => {
  mockBrowser({ locale: 'en-US', timezone: 'America/New_York' })
  const result = detectBrowserRegion()
  expect(result).toEqual({
    locale: 'en-US',
    timezone: 'America/New_York', 
    country: 'US',
    confidence: 'high'
  })
})

test('UK browser detection', () => {
  mockBrowser({ locale: 'en-GB', timezone: 'Europe/London' })
  const result = detectBrowserRegion()
  expect(result.country).toBe('GB')
})

test('fallback on API failure', () => {
  mockBrowserFailure()
  const result = detectBrowserRegion()
  expect(result.confidence).toBe('low')
  expect(result.locale).toBe('en-US') // Default fallback
})
```

### TIT-3: Date Formatting Integration
```typescript
// Test that region settings flow through to formatForUser
test('region settings affect date formatting', () => {
  const ukSettings = { locale: 'en-GB', timezone: 'Europe/London', country: 'GB' }
  const usSettings = { locale: 'en-US', timezone: 'America/New_York', country: 'US' }
  
  const birthday = '1985-07-15'
  const timestamp = '2024-01-15T14:30:00Z'
  
  const ukBirthday = formatForUser(birthday, 'dateOnly', ukSettings)
  const usBirthday = formatForUser(birthday, 'dateOnly', usSettings)
  
  expect(ukBirthday).toContain('July') // Same calendar date
  expect(usBirthday).toContain('July') // Same calendar date
  expect(ukBirthday !== usBirthday).toBe(true) // Different formatting
  
  const ukTimestamp = formatForUser(timestamp, 'datetime', ukSettings)  
  const usTimestamp = formatForUser(timestamp, 'datetime', usSettings)
  
  expect(ukTimestamp).toContain('14:30') // GMT time  
  expect(usTimestamp).toContain('09:30') // EST time (UTC-5)
})
```

### TIT-4: Component Integration Tests
```typescript
// Test RegionSettings component
test('RegionSettings saves to database', async () => {
  const mockUpdate = vi.fn()
  render(<RegionSettings onUpdate={mockUpdate} />)
  
  // Change locale
  await userEvent.selectOptions(screen.getByLabelText('Language & Region'), 'en-GB')
  
  // Save
  await userEvent.click(screen.getByText('Save Settings'))
  
  expect(mockUpdate).toHaveBeenCalledWith({
    locale: 'en-GB',
    timezone: expect.any(String),
    country: expect.any(String)
  })
})

// Test TimezoneMismatchBanner
test('TimezoneMismatchBanner switches timezone', async () => {
  const mockUpdate = vi.fn()
  const settings = { locale: 'en-US', timezone: 'America/Los_Angeles', country: 'US' }
  
  mockBrowserTimezone('America/New_York') // Different from settings
  
  render(<TimezoneMismatchBanner userSettings={settings} onUpdate={mockUpdate} />)
  
  expect(screen.getByText(/device time zone differs/)).toBeInTheDocument()
  
  await userEvent.click(screen.getByText('Use Device Time Zone'))
  
  expect(mockUpdate).toHaveBeenCalledWith({
    ...settings,
    timezone: 'America/New_York'
  })
})
```

---

## 🌍 Cross-Browser & Locale Tests

### CBT-1: Browser Compatibility Matrix
| Browser | Intl.DateTimeFormat | Timezone Detection | Locale Detection | Status |
|---------|-------------------|-------------------|------------------|---------|
| Chrome 80+ | ✅ | ✅ | ✅ | Full Support |
| Firefox 70+ | ✅ | ✅ | ✅ | Full Support |
| Safari 14+ | ✅ | ✅ | ✅ | Full Support |
| Edge 80+ | ✅ | ✅ | ✅ | Full Support |
| IE 11 | ❌ | ❌ | ⚠️ | Polyfill Required |

### CBT-2: Locale Detection Scenarios
- ✅ **US English**: `en-US` → `en-US` ✓
- ✅ **UK English**: `en-GB` → `en-GB` ✓  
- ✅ **Canadian English**: `en-CA` → `en-CA` ✓
- ✅ **Australian English**: `en-AU` → `en-AU` ✓
- ✅ **German**: `de-DE` → `de-DE` ✓
- ✅ **French**: `fr-FR` → `fr-FR` ✓
- ✅ **Underscore format**: `en_GB` → `en-GB` ✓
- ✅ **Language only**: `en` → `en-US` (fallback) ✓
- ✅ **Unsupported**: `zh-CN` → `en-US` (fallback) ✓

### CBT-3: Timezone Edge Cases
- ✅ **DST Transition**: Banner works during spring forward/fall back
- ✅ **Ambiguous Zones**: `America/New_York` vs `US/Eastern`
- ✅ **UTC Variants**: `UTC`, `GMT`, `Zulu` handling
- ✅ **Invalid Timezones**: Graceful fallback to UTC
- ✅ **Mobile Safari**: iOS timezone detection quirks

---

## 📱 Mobile & Responsive Tests

### MRT-1: Mobile Onboarding Experience
**Device**: iPhone/Android
- ✅ Region step fits mobile screen without horizontal scroll
- ✅ Timezone dropdown scrolls within viewport
- ✅ Auto-detect works on mobile browsers
- ✅ Preview section stacks vertically on small screens
- ✅ Buttons are touch-friendly (44px+ tap targets)

### MRT-2: Mobile Profile Settings
**Device**: Tablet/Mobile
- ✅ Region settings card is responsive
- ✅ Timezone search works with mobile keyboard
- ✅ Save button remains accessible after keyboard opens
- ✅ Preview grid adapts to screen size

### MRT-3: Mobile Timezone Banner
**Device**: Mobile
- ✅ Banner text wraps appropriately
- ✅ Action buttons stack vertically on narrow screens
- ✅ Banner doesn't obstruct navigation
- ✅ Dismiss 'X' button is easily tappable

---

## 🎨 Visual Consistency Tests (Screenshots)

### VCT-1: GB vs US Settings Comparison

**UK User Profile Settings:**
```
Region & Format Card:
┌─────────────────────────────────────────┐
│ 🌍 Region & Format                      │
│ Customize how dates and times appear.   │
│ Times show in your time zone.           │
│ Birthdays never shift.                  │
├─────────────────────────────────────────┤
│ Language & Region: English (UK) [GB]    │
│ Time Zone: Europe/London (GMT, UTC+0)   │  
│ Custom Date Format: [empty]             │
│                                         │
│ Preview:                                │
│ Birthday: 15 July 1985                  │
│ Timestamp: 15 Jan 2024, 14:30 GMT       │
│ Relative: 3 days ago                    │
│                              [Save]     │
└─────────────────────────────────────────┘
```

**US User Profile Settings:**
```
Region & Format Card:
┌─────────────────────────────────────────┐
│ 🌍 Region & Format                      │
│ Customize how dates and times appear.   │
│ Times show in your time zone.           │
│ Birthdays never shift.                  │
├─────────────────────────────────────────┤
│ Language & Region: English (US) [US]    │
│ Time Zone: America/New_York (EST, UTC-5)│
│ Custom Date Format: [empty]             │
│                                         │
│ Preview:                                │
│ Birthday: July 15, 1985                 │
│ Timestamp: Jan 15, 2024, 9:30 AM EST    │
│ Relative: 3 days ago                    │
│                              [Save]     │
└─────────────────────────────────────────┘
```

### VCT-2: Timezone Mismatch Banner
```
⚠️ We noticed your device time zone differs from your profile.
   Profile: Europe/London (GMT, UTC+0)
   Device: America/New_York (EST, UTC-5)
                    [Use Device Time Zone] [X]
```

### VCT-3: Onboarding Step 5
```
         🌍 Confirm your region settings
    We've detected your preferences from your browser.
    
┌─────────────────────────────────────────────────────┐
│          🗺️ Auto-detected from your browser         │
│                                                     │
│ Language & Region: [English (UK) ▼]                 │
│ Time Zone: [Europe/London ▼]                        │
│                                                     │
│ Preview:                                            │
│ ┌─────────────┬─────────────────────────────────┐   │
│ │ Birthday    │ Timestamp                       │   │
│ │ 15 July 1985│ 15 Jan 2024, 14:30 GMT        │   │
│ │ Never changes│ Shows in your timezone         │   │
│ └─────────────┴─────────────────────────────────┘   │
│                                                     │
│ 🕐 How this works:                                  │
│ • Times show in your time zone                      │
│ • Birthdays never shift                             │
│ • You can change these anytime                      │
└─────────────────────────────────────────────────────┘
        [Skip for now]              [Continue →]
```

---

## ✅ Pass/Fail Criteria

### Critical (Must Pass)
- [ ] **UAT-1**: Browser detection works in 90%+ of cases
- [ ] **UAT-4**: Timezone mismatch detection is accurate  
- [ ] **UAT-5**: Timezone switch updates database and re-renders dates
- [ ] **TIT-3**: Date formatting respects user region settings
- [ ] **CBT-1**: Works in Chrome, Firefox, Safari, Edge

### Important (Should Pass)  
- [ ] **UAT-2**: Region settings persist across sessions
- [ ] **UAT-3**: Profile settings page is fully functional
- [ ] **TIT-2**: Browser detection handles edge cases gracefully
- [ ] **MRT-1**: Mobile experience is usable and responsive

### Nice-to-Have (May Pass)
- [ ] **CBT-3**: Handles all timezone edge cases perfectly
- [ ] **VCT-1**: Visual consistency matches design specs exactly
- [ ] **IE 11**: Basic functionality with polyfills

---

## 🚀 Test Execution Commands

```bash
# Unit tests
npm run test src/utils/__tests__/browserDetection.test.ts
npm run test src/components/__tests__/RegionSettings.test.tsx

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e -- --spec="onboarding-region.cy.ts"
npm run test:e2e -- --spec="profile-region-settings.cy.ts"
npm run test:e2e -- --spec="timezone-mismatch.cy.ts"

# Cross-browser tests (if Playwright configured)
npm run test:cross-browser

# Manual test checklist
npm run test:manual-checklist
```

**Acceptance Criteria**: All Critical tests pass, 80%+ of Important tests pass, settings persist and dates re-render correctly.