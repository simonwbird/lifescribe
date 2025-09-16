-- Add transcript field to media table for voice recordings
ALTER TABLE public.media 
ADD COLUMN transcript_text TEXT;