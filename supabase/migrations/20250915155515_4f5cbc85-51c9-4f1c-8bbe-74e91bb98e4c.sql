-- Fix storage policies for media bucket to allow audio uploads

-- Create policies for the media bucket if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- Remove existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Family members can upload media files" ON storage.objects;
DROP POLICY IF EXISTS "Family members can view media files" ON storage.objects;
DROP POLICY IF EXISTS "Family members can update media files" ON storage.objects;
DROP POLICY IF EXISTS "Family members can delete media files" ON storage.objects;

-- Create comprehensive media upload policies
CREATE POLICY "Family members can upload media files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can view media files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can update media files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL AND
  owner = auth.uid()
);

CREATE POLICY "Family members can delete media files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL AND
  owner = auth.uid()
);