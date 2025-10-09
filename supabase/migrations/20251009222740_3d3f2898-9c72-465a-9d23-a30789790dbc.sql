-- Create entity_links table for cross-linking content to entities
CREATE TABLE public.entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL, -- 'story', 'comment', 'tribute', etc.
  source_id UUID NOT NULL,
  entity_type TEXT NOT NULL, -- 'person', 'event', 'property', 'thing', 'recipe', 'pet'
  entity_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  link_strength NUMERIC DEFAULT 1.0, -- AI confidence score or user-confirmed
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id, entity_type, entity_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_entity_links_source ON public.entity_links(source_type, source_id);
CREATE INDEX idx_entity_links_entity ON public.entity_links(entity_type, entity_id);
CREATE INDEX idx_entity_links_family ON public.entity_links(family_id);

-- Enable RLS
ALTER TABLE public.entity_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Family members can view entity links"
  ON public.entity_links FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create entity links"
  ON public.entity_links FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Link creators can delete their links"
  ON public.entity_links FOR DELETE
  USING (created_by = auth.uid());

-- Function to find entity suggestions based on text content
CREATE OR REPLACE FUNCTION public.suggest_entity_links(
  p_content TEXT,
  p_family_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  match_score NUMERIC,
  match_reason TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  content_lower TEXT;
  content_words TEXT[];
BEGIN
  content_lower := lower(p_content);
  content_words := regexp_split_to_array(content_lower, '\s+');
  
  -- Find matching people by name
  RETURN QUERY
  SELECT 
    'person'::TEXT as entity_type,
    p.id as entity_id,
    p.full_name as entity_name,
    CASE 
      WHEN content_lower LIKE '%' || lower(p.full_name) || '%' THEN 1.0
      WHEN content_lower LIKE '%' || lower(split_part(p.full_name, ' ', 1)) || '%' THEN 0.7
      ELSE 0.5
    END as match_score,
    'Name mentioned in content' as match_reason
  FROM public.people p
  WHERE p.family_id = p_family_id
    AND (
      content_lower LIKE '%' || lower(p.full_name) || '%' OR
      content_lower LIKE '%' || lower(split_part(p.full_name, ' ', 1)) || '%'
    )
  ORDER BY match_score DESC
  LIMIT p_limit;
  
  -- Find matching events by title or person
  RETURN QUERY
  SELECT 
    'event'::TEXT as entity_type,
    e.id as entity_id,
    e.title as entity_name,
    0.8 as match_score,
    'Event title or date mentioned' as match_reason
  FROM public.events e
  WHERE e.family_id = p_family_id
    AND content_lower LIKE '%' || lower(e.title) || '%'
  LIMIT p_limit;
  
  -- Find matching properties by name
  RETURN QUERY
  SELECT 
    'property'::TEXT as entity_type,
    prop.id as entity_id,
    prop.name as entity_name,
    0.7 as match_score,
    'Property name mentioned' as match_reason
  FROM public.properties prop
  WHERE prop.family_id = p_family_id
    AND content_lower LIKE '%' || lower(prop.name) || '%'
  LIMIT p_limit;
  
  -- Find matching things by name
  RETURN QUERY
  SELECT 
    'thing'::TEXT as entity_type,
    t.id as entity_id,
    t.name as entity_name,
    0.7 as match_score,
    'Object name mentioned' as match_reason
  FROM public.things t
  WHERE t.family_id = p_family_id
    AND content_lower LIKE '%' || lower(t.name) || '%'
  LIMIT p_limit;
  
  -- Find matching recipes by title
  RETURN QUERY
  SELECT 
    'recipe'::TEXT as entity_type,
    r.id as entity_id,
    r.title as entity_name,
    0.6 as match_score,
    'Recipe mentioned' as match_reason
  FROM public.recipes r
  WHERE r.family_id = p_family_id
    AND content_lower LIKE '%' || lower(r.title) || '%'
  LIMIT p_limit;
  
  -- Find matching pets by name
  RETURN QUERY
  SELECT 
    'pet'::TEXT as entity_type,
    pet.id as entity_id,
    pet.name as entity_name,
    0.7 as match_score,
    'Pet name mentioned' as match_reason
  FROM public.pets pet
  WHERE pet.family_id = p_family_id
    AND content_lower LIKE '%' || lower(pet.name) || '%'
  LIMIT p_limit;
END;
$$;