# Composer Deep-Linking QA Checklist

## A) Header Create Button & Dropdown

### Quick Add Sheet
- [ ] Click "Create" button in header → Quick Add sheet opens
- [ ] Press `C` keyboard shortcut → Quick Add sheet opens
- [ ] Analytics event `quick_add_open` fires with `source: 'header'`
- [ ] Sheet displays all content types (Story, Recipe, Event, etc.)

### Dropdown Menu
- [ ] Click chevron on "Create" button → Dropdown menu opens
- [ ] Press `Shift+C` keyboard shortcut → Dropdown menu opens
- [ ] Analytics event `quick_add_open` fires with `source: 'header'`
- [ ] Dropdown displays: Story (Text), Story (Photo), Story (Voice), Story (Video), Mixed, Recipe, Object/Heirloom, Event

### Dropdown Routing
- [ ] "Story (Text)" → navigates to `/stories/new-tabbed?tab=text&source=menu`
- [ ] "Story (Photo)" → navigates to `/stories/new-tabbed?tab=photo&source=menu`
- [ ] "Story (Voice)" → navigates to `/stories/new-tabbed?tab=voice&source=menu`
- [ ] "Story (Video)" → navigates to `/stories/new-tabbed?tab=video&source=menu`
- [ ] "Mixed" → navigates to `/stories/new-tabbed?tab=mixed&source=menu`
- [ ] "Recipe" → navigates to `/recipes/new?source=menu`
- [ ] "Object/Heirloom" → navigates to `/objects/new?source=menu`
- [ ] "Event" → navigates to `/events/new?source=menu`
- [ ] Each selection fires `quick_add_select` analytics event with `item`, `route`, and `source`

### Analytics Context
- [ ] All events include `user_role` (admin, member, etc.)
- [ ] All events include `persona_mode` (simple or studio)
- [ ] All events include `device` (mobile or desktop)
- [ ] All events include detailed `device_info` object

## B) Home Hero Tiles

### Tile Routing
- [ ] "Today's Prompt" → `/stories/new-tabbed?tab=voice&promptId=[id or 'today']&source=hero`
- [ ] "Resume Drafts" → `/drafts`
- [ ] "Add Photo" → `/stories/new-tabbed?tab=photo&source=hero`
- [ ] "Create Event" → `/events/new?source=hero`
- [ ] "Invite Family" → `/invites/new?source=hero`

### Elder Mode Override
- [ ] In Elder Mode + "Today's Prompt" → Opens inline recorder on Home page
- [ ] In Elder Mode fallback → Falls back to standard navigation URL
- [ ] Analytics event `quick_add_open` fires with `source: 'hero'`

### Tile Interactions
- [ ] Each tile click fires `quick_add_select` analytics with correct `item` and `route`
- [ ] Draft count badge displays correctly when drafts exist
- [ ] Prompt subtitle shows current prompt title or fallback text

## C) Composer Tab Routing

### Active Tab Matching
- [ ] URL `/stories/new-tabbed?tab=text` → Text tab is active
- [ ] URL `/stories/new-tabbed?tab=photo` → Photo tab is active
- [ ] URL `/stories/new-tabbed?tab=voice` → Voice tab is active
- [ ] URL `/stories/new-tabbed?tab=video` → Video tab is active
- [ ] URL `/stories/new-tabbed?tab=mixed` → Mixed tab is active
- [ ] Default (no tab param) → Text tab is active

### Tab Switching
- [ ] Switch tabs → URL updates with `?tab=` parameter
- [ ] Browser back button after tab switch → Returns to previous tab
- [ ] Tab state persists across page refreshes
- [ ] Switching tabs preserves content in shared state

### Prompt Prefill
- [ ] URL with `?promptId=xyz` → Prompt badge appears in header
- [ ] Badge displays prompt title from database
- [ ] `?promptId=today` → Badge shows "Today's Prompt"
- [ ] Analytics `composer_open` includes `promptId` in `params_present`

## D) Mixed Capture Hand-off

### Cross-Media Detection
- [ ] Add text + photo → "Upgrade to Mixed" alert appears
- [ ] Add text + audio → "Upgrade to Mixed" alert appears
- [ ] Add photo + audio → "Upgrade to Mixed" alert appears
- [ ] Add video + text → "Upgrade to Mixed" alert appears
- [ ] Already in Mixed tab → Alert does not appear

### Content Preservation
- [ ] Click "Upgrade to Mixed" → Switches to Mixed tab
- [ ] All existing content (title, text, media) preserved
- [ ] URL updates to `?tab=mixed`
- [ ] Autosave continues working in Mixed tab
- [ ] No data loss during tab transition

## E) Autosave & Drafts

### Autosave Behavior
- [ ] Content autosaves every 3 seconds after typing stops
- [ ] Blur (unfocus) from title field → Immediate save
- [ ] Blur from content field → Immediate save
- [ ] Autosave indicator shows "Saving..." during save
- [ ] Autosave indicator shows "Saved" after successful save
- [ ] Draft ID assigned and persists in URL after first save

### Route Change Toast
- [ ] Navigate away with unsaved changes → "Saved as draft" toast appears
- [ ] Toast duration: 2 seconds
- [ ] Navigation proceeds after toast
- [ ] No modal blocking navigation

### Drafts Page
- [ ] `/drafts` lists all user's draft stories
- [ ] Each draft shows: title, content preview, type icon, last edited time
- [ ] Type icons: Text, Photo, Voice, Video, Mixed icons display correctly
- [ ] Type label displays: "Text", "Photo", "Voice", "Video", "Mixed"
- [ ] "Resume" button → navigates to `/stories/new-tabbed?draft=[id]&tab=[original-tab]`
- [ ] "Delete" button → prompts confirmation and deletes draft
- [ ] Empty state shows "No drafts yet" with "Create New Story" button

### Draft Recovery
- [ ] Kill tab → Reopen `/drafts` → Draft appears in list
- [ ] Click "Resume" → Opens composer with all content restored
- [ ] Opens in correct original tab (text, photo, voice, etc.)
- [ ] Title, content, date, and metadata all preserved
- [ ] Continues autosaving to same draft ID

### Draft Metadata
- [ ] Tab info stored in `stories.metadata.tab`
- [ ] Source stored in `stories.metadata.source`
- [ ] Analytics `draft_save` fires with `draft_id`, `tab`, `has_title`, `has_content`
- [ ] Analytics `draft_resume` fires when opening draft with `draft_id`, `tab`

## F) Analytics Events

### Event Coverage
- [ ] `quick_add_open` → Fires when Create menu/sheet opens
- [ ] `quick_add_select` → Fires when menu item selected
- [ ] `composer_open` → Fires when composer page loads
- [ ] `draft_save` → Fires when draft autosaves
- [ ] `draft_resume` → Fires when resuming draft

### Event Properties
All events must include:
- [ ] `user_role` → User's role in family (admin, member, etc.)
- [ ] `persona_mode` → Current mode (simple or studio)
- [ ] `device` → Device type (mobile or desktop)
- [ ] `device_info` → Full device context object with:
  - [ ] `userAgent`
  - [ ] `platform`
  - [ ] `screenWidth`
  - [ ] `screenHeight`
  - [ ] `viewport.width`
  - [ ] `viewport.height`
  - [ ] `deviceType`

### Event-Specific Properties
- [ ] `composer_open` includes: `route`, `tab`, `params_present` object
- [ ] `quick_add_select` includes: `item`, `route`, `source`
- [ ] `draft_save` includes: `draft_id`, `tab`, `has_title`, `has_content`
- [ ] `draft_resume` includes: `draft_id`, `tab`

## G) Deep Link Parameters

### Parameter Handling
- [ ] `?promptId=xyz` → Loads prompt and shows badge
- [ ] `?personId=xyz` → Pre-tags person (if implemented)
- [ ] `?children=id1,id2` → Pre-tags multiple people (if implemented)
- [ ] `?circle=xyz` → Pre-selects audience circle (if implemented)
- [ ] `?album=xyz` → Pre-selects album (if implemented)
- [ ] `?source=menu` → Tracked in analytics
- [ ] `?source=hero` → Tracked in analytics

### URL State
- [ ] Query parameters persist during tab switches
- [ ] Browser back/forward maintains parameter state
- [ ] Parameters included in analytics events

## H) Navigation & UX

### Back Button Behavior
- [ ] Click browser back from composer → Returns to previous page
- [ ] Back button maintains previous scroll position (if applicable)
- [ ] Back from draft → Returns to `/drafts` page
- [ ] Back from hero tile action → Returns to home

### Keyboard Shortcuts
- [ ] `C` key → Opens Quick Add sheet (when not typing)
- [ ] `Shift+C` → Opens Create dropdown menu (when not typing)
- [ ] Shortcuts don't fire when typing in input fields
- [ ] Shortcuts don't fire when typing in contentEditable elements

### Loading States
- [ ] Composer loads draft data before rendering
- [ ] Draft count badge updates in real-time
- [ ] Autosave indicator shows clear states (idle, saving, saved)
- [ ] No flash of empty content when loading drafts

## Edge Cases

### Data Integrity
- [ ] Rapid tab switching preserves all content
- [ ] Multiple devices editing same draft → Last save wins
- [ ] Network offline → Draft saves to localStorage fallback (if implemented)
- [ ] Invalid draft ID in URL → Handles gracefully

### Browser Compatibility
- [ ] Chrome/Edge → All features work
- [ ] Safari → All features work
- [ ] Firefox → All features work
- [ ] Mobile Safari → All features work
- [ ] Mobile Chrome → All features work

### Responsive Design
- [ ] Mobile: Create button shows icon only, dropdown works
- [ ] Mobile: Hero tiles stack vertically
- [ ] Mobile: Composer tabs scrollable
- [ ] Desktop: All elements fit properly
- [ ] Tablet: Layout adapts correctly

## Performance

### Analytics Batching
- [ ] Multiple events batch together (max 10 or 2 seconds)
- [ ] No API call for every single event
- [ ] Console shows batched analytics in development

### Autosave Throttling
- [ ] Typing rapidly doesn't cause excessive saves
- [ ] 3-second debounce working correctly
- [ ] Blur triggers immediate save without delay

---

## Test Environment Setup

1. Create test user account
2. Join/create test family
3. Clear localStorage before testing
4. Open browser dev tools to monitor:
   - Console logs for analytics events
   - Network tab for API calls
   - Application tab for localStorage

## Regression Testing

After any code changes, verify:
- [ ] All routing paths still work
- [ ] Analytics events still fire
- [ ] Autosave still functions
- [ ] Drafts can be resumed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build completes successfully
