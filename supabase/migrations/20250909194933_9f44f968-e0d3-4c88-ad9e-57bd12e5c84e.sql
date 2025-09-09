-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', false);

-- Create storage policies for media bucket
CREATE POLICY "Family members can view media files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media' AND (storage.foldername(name))[1] IN (
  SELECT family_id::text FROM public.members WHERE profile_id = auth.uid()
));

CREATE POLICY "Family members can upload media files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] IN (
  SELECT family_id::text FROM public.members WHERE profile_id = auth.uid()
));

CREATE POLICY "Media owners can update their files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'media' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Media owners can delete their files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media' AND (storage.foldername(name))[2] = auth.uid()::text);