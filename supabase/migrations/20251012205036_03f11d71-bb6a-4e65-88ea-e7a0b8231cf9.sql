-- Add media_id column to comments table to support photo comments
ALTER TABLE public.comments 
ADD COLUMN media_id uuid REFERENCES public.media(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_comments_media_id ON public.comments(media_id);

-- Add check constraint to ensure comment is linked to exactly one entity
ALTER TABLE public.comments 
ADD CONSTRAINT comment_entity_check 
CHECK (
  (story_id IS NOT NULL AND tribute_id IS NULL AND answer_id IS NULL AND media_id IS NULL) OR
  (story_id IS NULL AND tribute_id IS NOT NULL AND answer_id IS NULL AND media_id IS NULL) OR
  (story_id IS NULL AND tribute_id IS NULL AND answer_id IS NOT NULL AND media_id IS NULL) OR
  (story_id IS NULL AND tribute_id IS NULL AND answer_id IS NULL AND media_id IS NOT NULL)
);