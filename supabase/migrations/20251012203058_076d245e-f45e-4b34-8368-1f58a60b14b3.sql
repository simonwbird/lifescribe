-- Allow family members to update tribute_id for audio recordings
-- This enables reassigning audio memories to different people within the family
CREATE POLICY "Family members can reassign audio recordings"
ON public.audio_recordings
FOR UPDATE
TO authenticated
USING (
  family_id IN (
    SELECT family_id 
    FROM members 
    WHERE profile_id = auth.uid()
  )
)
WITH CHECK (
  family_id IN (
    SELECT family_id 
    FROM members 
    WHERE profile_id = auth.uid()
  )
);