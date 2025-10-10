-- Fix ambiguous reference in person prompt instance generator
CREATE OR REPLACE FUNCTION public.generate_person_prompt_instances(p_person_id uuid, p_family_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_person_role text;
  prompt_rec RECORD;
  instances_created integer := 0;
BEGIN
  -- Determine person's primary relationship role
  v_person_role := public.get_person_relationship_role(p_person_id, p_family_id);

  -- Create instances for person-specific prompts matching this role
  FOR prompt_rec IN 
    SELECT * FROM public.prompts 
    WHERE scope = 'person_specific' 
      AND person_role = v_person_role
      AND enabled = true
  LOOP
    -- Ensure we don't duplicate existing instances for this family/prompt
    IF NOT EXISTS (
      SELECT 1 FROM public.prompt_instances pi
      WHERE pi.prompt_id = prompt_rec.id
        AND pi.family_id = p_family_id
    ) THEN
      INSERT INTO public.prompt_instances (prompt_id, family_id, source, status)
      VALUES (prompt_rec.id, p_family_id, 'static', 'open');
      instances_created := instances_created + 1;
    END IF;
  END LOOP;

  RETURN instances_created;
END;
$$;