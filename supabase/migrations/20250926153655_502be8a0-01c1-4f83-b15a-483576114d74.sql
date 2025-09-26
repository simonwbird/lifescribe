-- Create a security definer function to safely access person timeline items
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
  SELECT 
    pti.person_id,
    pti.item_id,
    pti.item_type,
    pti.happened_on,
    pti.occurred_precision,
    pti.is_approx,
    pti.title,
    pti.excerpt,
    pti.family_id
  FROM person_timeline_items pti
  WHERE pti.person_id = p_person_id
    AND pti.family_id IN (
      SELECT m.family_id 
      FROM members m 
      WHERE m.profile_id = auth.uid()
    )
  ORDER BY pti.happened_on;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION public.get_person_timeline_items(uuid) TO authenticated;