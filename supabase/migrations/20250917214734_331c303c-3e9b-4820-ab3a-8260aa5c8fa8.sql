-- Add individual_story_id to media table to support individual photo stories
-- This is in addition to the existing story_id which represents group stories
ALTER TABLE public.media 
ADD COLUMN individual_story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_media_individual_story_id ON public.media(individual_story_id);

-- Update RLS policies to include individual story access
-- Family members can still view media if they have access to either the main story or individual story