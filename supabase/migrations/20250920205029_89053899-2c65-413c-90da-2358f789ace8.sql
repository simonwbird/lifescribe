-- Add new columns for enhanced context capture
ALTER TABLE public.bug_reports 
ADD COLUMN ui_events jsonb DEFAULT '[]'::jsonb,
ADD COLUMN console_logs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN dedupe_key text,
ADD COLUMN consent_console_info boolean DEFAULT false;

-- Add index on dedupe_key for duplicate detection
CREATE INDEX idx_bug_reports_dedupe_key ON public.bug_reports(dedupe_key);

-- Add index on route + title for duplicate detection queries
CREATE INDEX idx_bug_reports_route_title ON public.bug_reports(route, title);

-- Function to compute dedupe key (SHA1 of route + normalized title)
CREATE OR REPLACE FUNCTION compute_bug_dedupe_key(p_route text, p_title text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_title text;
  hash_input text;
  dedupe_key text;
BEGIN
  -- Normalize title: lowercase, remove extra spaces, punctuation
  normalized_title := lower(trim(regexp_replace(p_title, '[^a-zA-Z0-9\s]', '', 'g')));
  normalized_title := regexp_replace(normalized_title, '\s+', ' ', 'g');
  
  -- Combine route and normalized title
  hash_input := COALESCE(p_route, '') || '|' || normalized_title;
  
  -- Compute SHA1 hash (simplified - would use proper crypto in production)
  dedupe_key := encode(digest(hash_input, 'sha1'), 'hex');
  
  RETURN dedupe_key;
END;
$$;

-- Function to find possible duplicates
CREATE OR REPLACE FUNCTION find_possible_duplicates(p_dedupe_key text, p_family_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  title text,
  status text,
  created_at timestamp with time zone,
  similarity_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    br.id,
    br.title,
    br.status,
    br.created_at,
    CASE 
      WHEN br.dedupe_key = p_dedupe_key THEN 1.0
      ELSE 0.8
    END as similarity_score
  FROM public.bug_reports br
  WHERE (
    br.dedupe_key = p_dedupe_key
    OR similarity(br.title, (
      SELECT title FROM public.bug_reports WHERE dedupe_key = p_dedupe_key LIMIT 1
    )) > 0.6
  )
  AND (p_family_id IS NULL OR br.family_id = p_family_id)
  AND br.status NOT IN ('Duplicate', 'Closed')
  ORDER BY similarity_score DESC, br.created_at DESC
  LIMIT 5;
END;
$$;