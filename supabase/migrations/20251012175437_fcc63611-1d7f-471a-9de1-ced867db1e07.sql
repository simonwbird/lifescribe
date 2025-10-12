-- Correct the foreign key to reference public.profiles instead of auth.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'audio_recordings' 
      AND constraint_name = 'audio_recordings_created_by_fkey'
  ) THEN
    ALTER TABLE public.audio_recordings
    DROP CONSTRAINT audio_recordings_created_by_fkey;
  END IF;
END $$;

ALTER TABLE public.audio_recordings
ADD CONSTRAINT audio_recordings_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;