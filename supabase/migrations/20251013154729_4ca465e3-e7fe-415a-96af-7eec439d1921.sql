-- Create function to get story creation analytics
CREATE OR REPLACE FUNCTION public.get_story_creation_analytics(
  p_family_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT now() - interval '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  modality_stats JSONB;
  prompt_stats JSONB;
BEGIN
  -- Get modality breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'mode', mode,
      'count', count,
      'percentage', ROUND((count::numeric / NULLIF(total, 0) * 100), 2)
    )
  ) INTO modality_stats
  FROM (
    SELECT 
      COALESCE(properties->>'mode', 'text') as mode,
      COUNT(*) as count,
      SUM(COUNT(*)) OVER () as total
    FROM public.analytics_events
    WHERE event_name = 'mode_selected'
      AND family_id = p_family_id
      AND created_at BETWEEN p_start_date AND p_end_date
    GROUP BY COALESCE(properties->>'mode', 'text')
  ) modes;

  -- Get prompt completion stats
  SELECT jsonb_agg(
    jsonb_build_object(
      'prompt_id', prompt_id,
      'prompt_title', prompt_title,
      'completions', completions,
      'avg_time_seconds', ROUND(avg_time_seconds, 2)
    )
  ) INTO prompt_stats
  FROM (
    SELECT 
      published.properties->>'prompt_id' as prompt_id,
      published.properties->>'prompt_title' as prompt_title,
      COUNT(*) as completions,
      AVG(
        EXTRACT(EPOCH FROM (published.created_at - started.created_at))
      )::numeric as avg_time_seconds
    FROM public.analytics_events started
    LEFT JOIN public.analytics_events published 
      ON published.properties->>'prompt_id' = started.properties->>'prompt_id'
      AND published.event_name = 'published'
      AND published.family_id = p_family_id
      AND published.created_at BETWEEN p_start_date AND p_end_date
    WHERE started.event_name = 'composer_opened'
      AND started.family_id = p_family_id
      AND started.created_at BETWEEN p_start_date AND p_end_date
      AND published.id IS NOT NULL
    GROUP BY published.properties->>'prompt_id', published.properties->>'prompt_title'
  ) prompts;

  -- Build final result
  result := jsonb_build_object(
    'period', jsonb_build_object(
      'start', p_start_date,
      'end', p_end_date
    ),
    'modality_breakdown', COALESCE(modality_stats, '[]'::jsonb),
    'prompt_completions', COALESCE(prompt_stats, '[]'::jsonb),
    'total_stories', (
      SELECT COUNT(*) 
      FROM public.analytics_events 
      WHERE event_name = 'published' 
        AND family_id = p_family_id
        AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'total_uploads', (
      SELECT COUNT(*) 
      FROM public.analytics_events 
      WHERE event_name = 'asset_uploaded' 
        AND family_id = p_family_id
        AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'total_tags', (
      SELECT COALESCE(SUM((properties->>'count')::int), 0)
      FROM public.analytics_events 
      WHERE event_name = 'people_tagged' 
        AND family_id = p_family_id
        AND created_at BETWEEN p_start_date AND p_end_date
    )
  );

  RETURN result;
END;
$$;