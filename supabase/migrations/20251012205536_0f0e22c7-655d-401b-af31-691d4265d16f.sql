-- Fix comments CHECK constraint to allow media_id as a valid single target
BEGIN;

-- Drop existing constraint if present
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_target_check;

-- Enforce exactly one target among story_id, tribute_id, answer_id, media_id
ALTER TABLE public.comments
ADD CONSTRAINT comments_target_check
CHECK (
  num_nonnulls(story_id, tribute_id, answer_id, media_id) = 1
);

COMMIT;