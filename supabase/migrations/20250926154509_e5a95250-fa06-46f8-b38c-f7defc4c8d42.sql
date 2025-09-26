-- Complete security fix: Remove the person_timeline_items view entirely
-- All access will go through the secure get_person_timeline_items() RPC function

-- First, drop any policies that might exist on the view (these will fail if not present)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Family members can view person timeline items" ON public.person_timeline_items;
  DROP POLICY IF EXISTS "Family members can create person timeline items" ON public.person_timeline_items;  
  DROP POLICY IF EXISTS "Family members can update person timeline items" ON public.person_timeline_items;
  DROP POLICY IF EXISTS "Family members can delete person timeline items" ON public.person_timeline_items;
EXCEPTION WHEN undefined_table OR undefined_object THEN
  -- Ignore if policies don't exist
  NULL;
END$$;

-- Drop the view completely (cascade to handle any dependencies)
DROP VIEW IF EXISTS public.person_timeline_items CASCADE;

-- Ensure our secure RPC function is properly defined and accessible
-- This RPC already exists from previous migration but let's ensure it's correct
CREATE OR REPLACE FUNCTION public.get_person_timeline_items(p_person_id uuid)
RETURNS TABLE (
  person_id uuid,
  item_id uuid,
  item_type text,
  happened_on date,
  occurred_precision date_precision,
  is_approx boolean,
  title text,
  excerpt text,
  family_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Stories linked to this person
  SELECT 
    psl.person_id,
    s.id AS item_id,
    'story'::text AS item_type,
    COALESCE(s.occurred_on, s.created_at::date) AS happened_on,
    s.occurred_precision,
    s.is_approx,
    s.title,
    left(s.content, 240) AS excerpt,
    s.family_id
  FROM person_story_links psl
  JOIN stories s ON s.id = psl.story_id
  WHERE psl.person_id = p_person_id
    AND s.family_id IN (
      SELECT m.family_id FROM members m WHERE m.profile_id = auth.uid()
    )
  
  UNION ALL
  
  -- Answers linked to this person  
  SELECT 
    pal.person_id,
    a.id AS item_id,
    'answer'::text AS item_type,
    COALESCE(a.occurred_on, a.created_at::date) AS happened_on,
    a.occurred_precision,
    a.is_approx,
    q.question_text AS title,
    left(a.answer_text, 240) AS excerpt,
    a.family_id
  FROM person_answer_links pal
  JOIN answers a ON a.id = pal.answer_id
  LEFT JOIN questions q ON q.id = a.question_id
  WHERE pal.person_id = p_person_id
    AND a.family_id IN (
      SELECT m.family_id FROM members m WHERE m.profile_id = auth.uid()
    )
  
  ORDER BY happened_on;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.get_person_timeline_items(uuid) TO authenticated;

-- Create a comment to document the security approach
COMMENT ON FUNCTION public.get_person_timeline_items IS 'Secure access to person timeline data - replaces direct view access to prevent unauthorized data exposure';