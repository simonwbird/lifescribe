# Analytics Implementation

## Overview
Complete analytics tracking for user interactions across the LifeScribe home interface with automatic context enrichment.

## Analytics Context
Every event automatically includes:
- **user_role**: Retrieved from `user_roles` table (admin, moderator, user)
- **persona_mode**: standard, elder, or guest
- **device**: mobile, tablet, or desktop (auto-detected)
- **timestamp**: ISO 8601 timestamp

## Tracked Events

### 1. Navigation Events

#### nav_logo_click
**Trigger**: User clicks LifeScribe logo in sidebar  
**Properties**:
```json
{
  "destination": "/home",
  "user_role": "user",
  "persona_mode": "standard",
  "device": "desktop"
}
```

#### nav_search_submit
**Trigger**: User selects a search result from CommandPalette  
**Properties**:
```json
{
  "entity_type": "person|story|event|recipe|object",
  "entity_id": "uuid",
  "destination": "/people/uuid",
  "user_role": "user",
  "persona_mode": "standard",
  "device": "mobile"
}
```

#### nav_quick_add_open
**Trigger**: User clicks quick add menu items in top bar  
**Properties**:
```json
{
  "item": "new_story|capture_photo|create_event|add_person",
  "route": "/new-story",
  "user_role": "user",
  "persona_mode": "elder",
  "device": "tablet"
}
```

### 2. Hero Tile Events

#### hero_tile_click
**Trigger**: User clicks any hero tile on home page  
**Properties**:
```json
{
  "tile_name": "prompt|drafts|photo|event|invite",
  "destination": "/prompts/today",
  "user_role": "user",
  "persona_mode": "standard",
  "device": "desktop"
}
```

### 3. Right Rail Widget Events

#### right_rail_click
**Trigger**: User clicks widget in right rail (see §7 implementation)  
**Properties**:
```json
{
  "widget": "this_weeks_captures|vault_progress|data_health|citations|suggestions|upcoming",
  "item": "optional_specific_item",
  "destination": "/analytics/captures?range=this-week",
  "user_role": "admin",
  "persona_mode": "standard",
  "device": "desktop"
}
```

## Implementation Details

### useAnalytics Hook
Location: `src/hooks/useAnalytics.ts`

```typescript
const { track, context } = useAnalytics(userId)

// Track an event
track('event_name', {
  property1: 'value1',
  property2: 'value2'
})
```

### Context Loading
- User role fetched from `user_roles` table on mount
- Persona mode fetched from `profiles.elder_mode` field
- Device type detected from window width + user agent
- Context cached and reused for all events in session

### Data Storage
Events stored in `analytics_events` table:
```sql
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_name text NOT NULL,
  properties jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

## Visibility & Performance

### Event Latency
- Events appear in analytics console within 60 seconds
- Async tracking doesn't block UI interactions
- Failed events logged to console in development

### Console Logging
Development mode includes detailed event logs:
```
[Analytics] {
  event_name: "hero_tile_click",
  properties: {
    tile_name: "prompt",
    destination: "/prompts/today",
    user_role: "user",
    persona_mode: "standard",
    device: "desktop",
    timestamp: "2025-10-14T..."
  }
}
```

## Testing Checklist

- [ ] Logo click tracks `nav_logo_click` with /home destination
- [ ] Search result selection tracks `nav_search_submit` with entity details
- [ ] Quick add menu tracks `nav_quick_add_open` with item and route
- [ ] Hero tiles track `hero_tile_click` with tile name and destination
- [ ] Right rail widgets track `right_rail_click` with widget and item
- [ ] All events include user_role, persona_mode, device
- [ ] Events visible in analytics console within 60s
- [ ] Mobile/tablet/desktop device detection works
- [ ] Elder mode persona properly detected

## Privacy & Security

### User Roles Security
- User roles stored in separate `user_roles` table (not on profiles)
- Prevents privilege escalation attacks
- Uses security definer functions for role checks
- Never uses client-side storage for role validation

### PII Considerations
- Event properties include entity IDs (not user PII)
- User role is permission level, not identifying information
- Persona mode is behavioral preference, not sensitive data
- Device type is technical metadata only

## Future Enhancements

1. **Session tracking**: Group events into user sessions
2. **Funnel analysis**: Track multi-step workflows
3. **A/B testing**: Support variant tracking
4. **Performance metrics**: Add timing data
5. **Error tracking**: Integrate with Sentry
6. **Retention cohorts**: Track user engagement over time
