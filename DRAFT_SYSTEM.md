# Draft System Implementation

## Overview
Implemented a comprehensive draft system with autosave and recovery capabilities for story creation.

## Features

### 1. Autosave (10-second interval)
- **Interval**: Changed from 5 seconds to 10 seconds
- **Location**: 
  - `useStoryAutosave` hook for database-backed drafts
  - `useDraftManager` hook for localStorage fallback
- **Triggers**: 
  - Automatic every 10 seconds when content changes
  - Immediate save on blur events (title/content fields)

### 2. Force Save on Blur
- Added `forceSave` function to `useStoryAutosave` hook
- TextPanel now triggers immediate save when user leaves title or content fields
- Ensures no data loss when navigating away or switching tabs

### 3. Draft Recovery
- **Location**: `/drafts` page (DraftsPage.tsx)
- Lists all recoverable drafts from the database
- Shows:
  - Draft title
  - Content preview
  - Last updated timestamp
  - Delete and Resume buttons

### 4. Browser Crash Recovery
- Drafts are saved to Supabase `stories` table with `status: 'draft'`
- LocalStorage fallback via `useDraftManager` (24-hour expiry)
- Both systems ensure work can be recovered after crash/reload

### 5. Resume Flow
- Resume button on `/drafts` page navigates to `/stories/new?draft={id}`
- UniversalComposer detects `draft` query parameter
- Loads existing draft data and populates the composer
- Continues autosaving to the same draft record

## Modified Files

### Hooks
- `src/hooks/useStoryAutosave.ts` - Added 10s interval, forceSave function
- `src/hooks/useDraftManager.ts` - Updated to 10s interval

### Components
- `src/components/composer/TextPanel.tsx` - Added onBlur prop and handlers
- `src/components/composer/UniversalComposer.tsx` - Integrated autosave, blur handlers, draft loading
- `src/pages/DraftsPage.tsx` - Already existed, works with new system

### Features Flow
1. User starts creating a story
2. Every 10 seconds, draft is saved to database
3. On blur (leaving title/content field), immediate save
4. If browser crashes, draft persists in database
5. User visits `/drafts` page
6. Clicks "Resume" on a draft
7. Composer loads with saved data
8. Continues autosaving to same draft
9. When published, draft is deleted from database

## Acceptance Criteria ✅
- ✅ Autosave every 10s
- ✅ Autosave on blur
- ✅ Saves to draft_stories (Supabase stories table with status='draft')
- ✅ LocalStorage fallback available
- ✅ /drafts page lists recoverable drafts
- ✅ Resume opens Composer with state restored
- ✅ Browser crash/reload → can recover draft intact
