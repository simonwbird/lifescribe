-- Use fully-qualified digest() to work with Supabase 'extensions' schema
CREATE OR REPLACE FUNCTION public.calculate_audit_hash(
  p_sequence_number bigint,
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_details jsonb,
  p_previous_hash text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  hash_input text;
  calculated_hash text;
BEGIN
  hash_input := CONCAT(
    COALESCE(p_sequence_number::text, ''), '|', COALESCE(p_actor_id::text, ''), '|',
    COALESCE(p_action, ''), '|', COALESCE(p_entity_type, ''), '|', COALESCE(p_entity_id::text, ''), '|',
    COALESCE(p_details::text, '{}'), '|', COALESCE(p_previous_hash, '')
  );
  calculated_hash := encode(extensions.digest(convert_to(hash_input, 'UTF8'), 'sha256'), 'hex');
  RETURN calculated_hash;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_bug_dedupe_key(p_route text, p_title text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  normalized_title text;
  hash_input text;
  dedupe_key text;
BEGIN
  normalized_title := lower(trim(regexp_replace(p_title, '[^a-zA-Z0-9\s]', '', 'g')));
  normalized_title := regexp_replace(normalized_title, '\s+', ' ', 'g');
  hash_input := COALESCE(p_route, '') || '|' || normalized_title;
  dedupe_key := encode(extensions.digest(convert_to(hash_input, 'UTF8'), 'sha1'), 'hex');
  RETURN dedupe_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_family_collision_signals()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  family_record RECORD;
  processed_count INTEGER := 0;
  collision_candidates UUID[];
  risk_score INTEGER;
  hash_data JSONB;
BEGIN
  FOR family_record IN 
    SELECT f.id, f.name, f.created_at, f.status
    FROM public.families f
    WHERE f.status = 'provisional' 
      AND f.created_at > (now() - interval '30 days')
  LOOP
    hash_data := jsonb_build_object(
      'name_hash', encode(extensions.digest(convert_to(lower(trim(regexp_replace(family_record.name, '[^a-zA-Z0-9]+', '-', 'g'))), 'UTF8'), 'sha256'), 'hex'),
      'created_week', to_char(family_record.created_at, 'YYYY-WW')
    );
    SELECT array_agg(DISTINCT fcs.family_id) INTO collision_candidates
    FROM public.family_collision_signals fcs
    WHERE fcs.family_id != family_record.id
      AND (
        fcs.hashed_signals->>'name_hash' = hash_data->>'name_hash'
        OR fcs.hashed_signals->>'created_week' = hash_data->>'created_week'
      );
    risk_score := COALESCE(array_length(collision_candidates, 1), 0) * 10;
    INSERT INTO public.family_collision_signals (
      family_id, name_slug, hashed_signals, risk_score, collision_candidates, last_computed_at
    ) VALUES (
      family_record.id,
      lower(trim(regexp_replace(family_record.name, '[^a-zA-Z0-9]+', '-', 'g'))),
      hash_data,
      risk_score,
      COALESCE(collision_candidates, '{}'),
      now()
    )
    ON CONFLICT (family_id) DO UPDATE SET
      hashed_signals = EXCLUDED.hashed_signals,
      risk_score = EXCLUDED.risk_score,
      collision_candidates = EXCLUDED.collision_candidates,
      last_computed_at = EXCLUDED.last_computed_at,
      updated_at = now();
    processed_count := processed_count + 1;
  END LOOP;
  RETURN processed_count;
END;
$$;