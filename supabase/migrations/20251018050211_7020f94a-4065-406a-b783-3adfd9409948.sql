-- Fix feed_for_user to load media from story_assets table
DROP FUNCTION IF EXISTS public.feed_for_user(uuid, int, timestamptz);

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
    'family'::text as visibility,
    'story'::text as content_type,
    s.content as text,
    s.title,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', sa.id,
            'url', sa.url,
            'type', CASE 
              WHEN sa.type = 'image' THEN 'image'
              WHEN sa.type = 'video' THEN 'video'
              WHEN sa.type = 'audio' THEN 'audio'
              ELSE 'other'
            END,
            'mime_type', COALESCE(sa.metadata->>'mime_type', 'unknown'),
            'order', COALESCE(sa.position, 0),
            'thumbnailUrl', sa.thumbnail_url
          )
          ORDER BY COALESCE(sa.position, 0)
        )
        FROM story_assets sa
        WHERE sa.story_id = s.id
      ),
      '[]'::jsonb
    ) as media
  FROM stories s
  WHERE s.created_at < p_cursor
    AND s.status = 'published'
    AND EXISTS (
      SELECT 1 FROM members m
      WHERE m.family_id = s.family_id
        AND m.profile_id = p_user
    )
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$;