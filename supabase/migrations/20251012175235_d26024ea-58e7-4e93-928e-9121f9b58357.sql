-- Add foreign key relationship from audio_recordings.created_by to profiles.id
-- This allows PostgREST embedded resource queries to work properly

ALTER TABLE public.audio_recordings
ADD CONSTRAINT audio_recordings_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;