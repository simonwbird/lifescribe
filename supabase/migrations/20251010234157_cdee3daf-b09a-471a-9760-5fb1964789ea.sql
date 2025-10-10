-- Create storage bucket for audio recordings if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for audio-recordings bucket
CREATE POLICY "Users can upload their own audio recordings"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'audio-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their family's audio recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'audio-recordings'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.audio_recordings ar
      JOIN public.members m ON m.family_id = ar.family_id
      WHERE ar.audio_url LIKE '%' || name || '%'
      AND m.profile_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their own audio recordings"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'audio-recordings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);