-- Create merge_history table for tracking all merges with undo capability
CREATE TABLE IF NOT EXISTS public.merge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'person' or 'media'
  canonical_id UUID NOT NULL,
  duplicate_id UUID NOT NULL,
  merged_data JSONB NOT NULL,
  reason TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id) NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  undone_at TIMESTAMPTZ,
  undone_by UUID REFERENCES auth.users(id),
  undo_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merge_history ENABLE ROW LEVEL SECURITY;

-- Policy: Family admins can view merge history for their family
CREATE POLICY "Family admins can view merge history"
  ON public.merge_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.profile_id = auth.uid()
        AND members.role = 'admin'
        AND (
          (entity_type = 'person' AND canonical_id IN (
            SELECT id FROM public.people WHERE family_id = members.family_id
          ))
          OR
          (entity_type = 'media' AND canonical_id IN (
            SELECT id FROM public.media WHERE family_id = members.family_id
          ))
        )
    )
  );

-- Index for performance
CREATE INDEX idx_merge_history_canonical ON public.merge_history(canonical_id);
CREATE INDEX idx_merge_history_duplicate ON public.merge_history(duplicate_id);
CREATE INDEX idx_merge_history_performed_at ON public.merge_history(performed_at DESC);

-- Add merged_into column to people table to track merges
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES public.people(id);

-- Index for merged people lookup
CREATE INDEX IF NOT EXISTS idx_people_merged_into ON public.people(merged_into);
