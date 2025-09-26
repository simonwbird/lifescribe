-- Update get_prompts_progress function to use correct column names
CREATE OR REPLACE FUNCTION get_prompts_progress(p_family_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  overall_stats jsonb;
  category_stats jsonb[];
  person_stats jsonb[];
  rec record;
BEGIN
  -- Get overall progress
  SELECT jsonb_build_object(
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_active', COUNT(*) FILTER (WHERE status IN ('open', 'in_progress', 'completed'))
  ) INTO overall_stats
  FROM public.prompt_instances pi
  WHERE pi.family_id = p_family_id;

  -- Get progress by category (from prompt category column)
  SELECT array_agg(
    jsonb_build_object(
      'category', category,
      'completed', completed_count,
      'total', total_count
    )
  ) INTO category_stats
  FROM (
    SELECT 
      COALESCE(p.category, 'Other') as category,
      COUNT(*) FILTER (WHERE pi.status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE pi.status IN ('open', 'in_progress', 'completed')) as total_count
    FROM public.prompt_instances pi
    JOIN public.prompts p ON pi.prompt_id = p.id
    WHERE pi.family_id = p_family_id
    GROUP BY COALESCE(p.category, 'Other')
    ORDER BY category
  ) category_progress;

  -- Get progress by person
  SELECT array_agg(
    jsonb_build_object(
      'person_id', person_id,
      'name', person_name,
      'completed', completed_count,
      'total', total_count
    )
  ) INTO person_stats
  FROM (
    SELECT 
      person_id,
      COALESCE(pe.full_name, 'Unknown') as person_name,
      COUNT(*) FILTER (WHERE pi.status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE pi.status IN ('open', 'in_progress', 'completed')) as total_count
    FROM public.prompt_instances pi
    JOIN unnest(pi.person_ids) as person_id ON true
    LEFT JOIN public.people pe ON pe.id = person_id::uuid
    WHERE pi.family_id = p_family_id
      AND array_length(pi.person_ids, 1) > 0
    GROUP BY person_id, pe.full_name
    ORDER BY pe.full_name
  ) person_progress;

  -- Build final result
  result := jsonb_build_object(
    'overall', overall_stats,
    'by_category', COALESCE(category_stats, '[]'::jsonb),
    'by_person', COALESCE(person_stats, '[]'::jsonb)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;