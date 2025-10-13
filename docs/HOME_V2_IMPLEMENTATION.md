# Home V2 Implementation

## Overview
World-class Home experience with persistent top bar and hero action strip.

## Components

### TopBar (`src/components/home/TopBar.tsx`)
Persistent header with:
- **Avatar Switcher**: Dropdown to switch between families
- **Global Search**: Command-style search for stories, people, events
- **Notifications**: Bell icon with unread count badge
- **Quick Add**: Plus button with dropdown for quick actions

### HeroStrip (`src/components/home/HeroStrip.tsx`)
Hero action tiles featuring:
1. **Today's Prompt** (Primary variant)
   - Shows current prompt or "What would you like to remember?"
   - Routes to `/new-story?prompt_id=X` or `/prompts`

2. **Resume Drafts**
   - Real-time draft count with badge
   - Updates within 1s via Supabase realtime
   - Routes to `/drafts`

3. **Add Photo**
   - Capture or scan photos
   - Routes to `/capture`

4. **Create Event**
   - Plan family events
   - Routes to `/events?new=true`

5. **Invite Family**
   - Grow family circle
   - Routes to `/family/members?invite=true`

### HomeV2 (`src/pages/HomeV2.tsx`)
Main page shell that:
- Loads user and family context
- Renders TopBar and HeroStrip
- Placeholder for feed (out of scope)

## Responsive Design
- **Mobile (< 640px)**: Vertical stack of hero tiles
- **Tablet/Desktop (≥ 640px)**: Horizontal scrollable strip

## Real-time Features
- Draft count updates within 1s via Postgres changes subscription
- Listens to stories table INSERT/UPDATE/DELETE events

## Routing
- Main route: `/home-v2`
- All hero tiles route with single tap
- Supports family switching via `?family=X` param

## Acceptance Criteria
✅ Mobile-first responsive layout
✅ Each hero tile routes with single tap
✅ Draft count accurate within 1s after create/delete
✅ Out of scope: Feed logic, voice recording

## Usage
Visit `/home-v2` to see the new Home experience.

## Future Enhancements
- Search functionality implementation
- Notifications system
- Family feed integration
- Voice recording from prompt tile
