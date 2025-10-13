# Story Creation Analytics

## Overview
Admin analytics tracking for story creation flow to measure what works and improve the user experience.

## Tracked Events

### 1. `composer_opened`
**When**: User opens the story composer
**Properties**:
- `mode`: Initial mode selected (text/photo/voice/video/mixed)
- `prompt_id`: If opened from a prompt (optional)
- `prompt_title`: Title of the prompt (optional)

### 2. `mode_selected`
**When**: User switches between story creation modes
**Properties**:
- `mode`: Selected mode (text/photo/voice/video/mixed)

### 3. `asset_uploaded`
**When**: User uploads a photo, video, or audio file
**Properties**:
- `asset_type`: Type of asset (photo/video/audio)
- `file_size`: Size of the file in bytes

### 4. `people_tagged`
**When**: User tags people in a story
**Properties**:
- `count`: Number of people tagged

### 5. `published`
**When**: User publishes a story (not a draft)
**Properties**:
- `story_id`: ID of the published story
- `prompt_id`: If created from a prompt (optional)
- `mode`: Creation mode used
- `time_to_publish_ms`: Time from composer open to publish

### 6. `processing_complete`
**When**: Video/audio processing completes
**Properties**:
- `story_id`: ID of the story
- `processing_time_ms`: Time taken to process

## Analytics Dashboard

### Location
`/analytics/stories` - Available to all family members

### Features

#### Summary Cards
- **Total Stories**: Count of published stories in last 30 days
- **Assets Uploaded**: Total photos, videos, and audio uploaded
- **People Tagged**: Total people tagged across all stories

#### Modality Breakdown (Pie Chart)
Shows distribution of story creation by mode:
- Text
- Photo
- Voice
- Video
- Mixed

Displays both count and percentage for each mode.

#### Prompt Completions (Bar Chart)
Shows which prompts drive the most story completions:
- Number of completions per prompt
- Average time to publish for each prompt
- Sorted by completion count

### Database Function

`get_story_creation_analytics(p_family_id, p_start_date, p_end_date)`

Returns aggregated analytics data:
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "modality_breakdown": [
    { "mode": "text", "count": 45, "percentage": 50 },
    { "mode": "photo", "count": 30, "percentage": 33.33 },
    { "mode": "voice", "count": 15, "percentage": 16.67 }
  ],
  "prompt_completions": [
    {
      "prompt_id": "uuid",
      "prompt_title": "What's your earliest memory?",
      "completions": 12,
      "avg_time_seconds": 300
    }
  ],
  "total_stories": 90,
  "total_uploads": 150,
  "total_tags": 280
}
```

## Implementation

### Hook: `useStoryAnalytics`
Location: `src/hooks/useStoryAnalytics.ts`

Provides analytics tracking methods:
```typescript
const analytics = useStoryAnalytics(familyId)

analytics.trackComposerOpened('text', promptId, promptTitle)
analytics.trackModeSelected('photo')
analytics.trackAssetUploaded('photo', 1024000)
analytics.trackPeopleTagged(3)
analytics.trackPublished(storyId, promptId, 'text')
analytics.trackProcessingComplete(storyId, 5000)
```

### Integration
Analytics is integrated into `UniversalComposer`:
- Composer opened: tracked on mount
- Mode selected: tracked on tab change
- Asset uploaded: tracked during file upload
- People tagged: tracked when person links are created
- Published: tracked on successful publish

### Privacy
- All events are associated with `family_id` for aggregation
- Individual `user_id` is tracked but not exposed in dashboard
- Only family members can view their family's analytics
- No PII is tracked in event properties

## Use Cases

1. **Product Insights**
   - Which creation modes are most popular?
   - Do prompts drive more completions?
   - What's the average time to create a story?

2. **Content Strategy**
   - Which prompts resonate with users?
   - Are users engaging with multimedia features?

3. **UX Optimization**
   - Where do users spend the most time?
   - Which modes have the highest drop-off?

## Future Enhancements

- Drop-off tracking (started but not published)
- Editing vs. new story analytics
- Time spent per mode
- Device/platform breakdown
- Funnel visualization
- Cohort analysis
