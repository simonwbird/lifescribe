-- Drop policy if it exists and recreate it
DROP POLICY IF EXISTS "Allow access via signed URLs" ON storage.objects;

-- Allow access to media via signed URLs
-- This policy allows accessing media through signed URLs without requiring additional RLS checks
CREATE POLICY "Allow access via signed URLs"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'media'
);

-- Ensure the media bucket configuration supports signed URLs
UPDATE storage.buckets
SET public = false  -- Keep bucket private but allow signed URL access
WHERE id = 'media';
