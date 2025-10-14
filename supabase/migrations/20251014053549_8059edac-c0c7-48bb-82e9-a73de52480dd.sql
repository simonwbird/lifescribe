-- Add metadata column to stories table for storing draft tab info
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;