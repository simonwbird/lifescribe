-- Add rail_config to people table for per-person right rail customization
ALTER TABLE public.people
ADD COLUMN IF NOT EXISTS rail_config JSONB DEFAULT '{
  "slots": {
    "QuickFacts": true,
    "PinnedHighlights": true,
    "TOC": true,
    "ContributeCTA": true,
    "Anniversaries": true,
    "VisibilitySearch": false,
    "MiniMap": true,
    "MediaCounters": true,
    "FavoritesQuirks": true,
    "Causes": true,
    "ShareExport": true
  }
}'::jsonb;