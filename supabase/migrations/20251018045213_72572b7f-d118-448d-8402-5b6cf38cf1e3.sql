-- Create feed_for_user RPC function
-- Returns stories with media, honoring visibility and family membership
CREATE OR REPLACE FUNCTION public.feed_for_user(
  p_user uuid,
  p_limit int DEFAULT 20,
  p_cursor timestamptz DEFAULT now()
)
RETURNS TABLE(
  id uuid,
  author_id uuid,
  family_id uuid,
  created_at timestamptz,
  visibility text,
  content_type text,
  text text,
  title text,
  media jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.profile_id as author_id,
    s.family_id,
    s.created_at,
    COALESCE(s.visibility, 'family')::text as visibility,
    'story'::text as content_type,
    s.content as text,
    s.title,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'url', m.file_path,
            'type', CASE 
              WHEN m.mime_type LIKE 'image/%' THEN 'image'
              WHEN m.mime_type LIKE 'video/%' THEN 'video'
              WHEN m.mime_type LIKE 'audio/%' THEN 'audio'
              ELSE 'other'
            END,
            'mime_type', m.mime_type,
            'order', COALESCE(el.position_x, 0)
          )
          ORDER BY COALESCE(el.position_x, 0)
        )
        FROM entity_links el
        INNER JOIN media m ON m.id = el.entity_id
        WHERE el.source_id = s.id
          AND el.source_type = 'story'
          AND el.entity_type = 'media'
      ),
      '[]'::jsonb
    ) as media
  FROM stories s
  WHERE s.created_at < p_cursor
    AND s.status = 'published'
    AND (
      -- Public stories visible to all
      COALESCE(s.visibility, 'family') = 'public'
      -- Family stories visible to family members
      OR (
        COALESCE(s.visibility, 'family') IN ('family', 'circle')
        AND EXISTS (
          SELECT 1 FROM members m
          WHERE m.family_id = s.family_id
            AND m.profile_id = p_user
        )
      )
      -- Private stories visible to author only
      OR (
        s.visibility = 'private'
        AND s.profile_id = p_user
      )
      -- Author can always see their own stories
      OR s.profile_id = p_user
    )
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$;