-- Drop the existing insert policy for comments
DROP POLICY IF EXISTS "Family members can create comments" ON public.comments;

-- Create updated insert policy that explicitly supports media_id
CREATE POLICY "Family members can create comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (
  (family_id IN ( 
    SELECT members.family_id
    FROM members
    WHERE (members.profile_id = auth.uid())
  )) 
  AND (profile_id = auth.uid())
  AND (
    (story_id IS NOT NULL AND tribute_id IS NULL AND answer_id IS NULL AND media_id IS NULL) OR
    (story_id IS NULL AND tribute_id IS NOT NULL AND answer_id IS NULL AND media_id IS NULL) OR
    (story_id IS NULL AND tribute_id IS NULL AND answer_id IS NOT NULL AND media_id IS NULL) OR
    (story_id IS NULL AND tribute_id IS NULL AND answer_id IS NULL AND media_id IS NOT NULL)
  )
);