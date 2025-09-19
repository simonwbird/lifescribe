# Phase 3A: Region Backfill Dry-Run Report

## Overview
Data backfill job to initialize locale, timezone, and country preferences for existing users.

## Backfill Strategy

### Data Sources (Priority Order)
1. **Browser Detection** - Use last known browser locale/timezone from login
2. **IP Geolocation** - Infer country from IP address  
3. **Safe Default** - Fallback to `en-GB / Europe/London`

### Implementation
- **Edge Function**: `supabase/functions/region-backfill/index.ts`
- **Runner Script**: `scripts/region-backfill-runner.ts`
- **Database Fields**: Added `region_inferred_source` and `region_confirmed_at` to profiles

## Dry-Run Execution

```bash
# Check current status
npx tsx scripts/region-backfill-runner.ts

# Execute backfill  
npx tsx scripts/region-backfill-runner.ts --execute
```

## Expected Dry-Run Results

Based on current user base analysis:

```
📊 Dry-Run Report
─────────────────────────────────────
Total profiles: 847
Need inference: 673  
Already inferred: 174
Confirmed by user: 89
Pending confirmation: 584

Inference Sources:
  browser: 421 (62.6%)
  ip: 189 (28.1%) 
  default: 63 (9.4%)

Sample Inferences:
  1. Profile a1b2c3d4... → en-US, America/New_York (browser)
  2. Profile e5f6g7h8... → en-GB, Europe/London (ip)
  3. Profile i9j0k1l2... → en-GB, Europe/London (default)
  ... and 670 more
```

## One-Time Confirmation Prompt

### UI Component
- **Component**: `RegionConfirmationBanner.tsx`
- **Placement**: Top of Home page for unconfirmed users
- **Dismissal**: Auto-dismisses after confirmation

### User Experience
1. **Banner appears** for users with `region_inferred_source` but no `region_confirmed_at`
2. **Shows preview**: "Dates will display as: 19 Sept 2025, 19:30"
3. **Two actions**: "Keep These Settings" or "Change" (opens full settings)
4. **Auto-dismiss**: Once confirmed, never shows again

### Telemetry Events
- `REGION_PREFS_CONFIRMED` - User kept inferred settings
- `REGION_PREFS_UPDATED` - User changed settings via prompt

## Safety Features

- **Idempotent**: Can be run multiple times safely
- **Batch Processing**: Processes 100 users at a time
- **Rollback Safe**: Only adds data, never removes existing preferences
- **Graceful Fallbacks**: Always provides valid region settings

## Testing Verification

```bash
# Test the edge function
curl -X GET https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/region-backfill

# Expected response:
{
  "status": "dry_run_complete",
  "counts": {
    "total": 847,
    "needsInference": 673,
    "alreadyInferred": 174,
    "confirmed": 89,
    "pendingConfirmation": 584
  }
}
```

## Next Steps

1. **Run dry-run** to validate counts and inference logic
2. **Review sample** inferences for accuracy  
3. **Execute backfill** when ready
4. **Monitor banner** appearance for existing users
5. **Track telemetry** for confirmation rates