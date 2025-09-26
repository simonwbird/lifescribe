-- Fix function search paths for security
CREATE OR REPLACE FUNCTION update_prompt_instance_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION create_default_prompt_instances(p_family_id UUID)
RETURNS INT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  instances_created INT := 0;
  prompt_record RECORD;
BEGIN
  -- Create instances for all general prompts
  FOR prompt_record IN 
    SELECT id FROM prompts WHERE scope = 'general' AND enabled = true
  LOOP
    INSERT INTO prompt_instances (prompt_id, family_id, source, status)
    VALUES (prompt_record.id, p_family_id, 'static', 'open');
    instances_created := instances_created + 1;
  END LOOP;
  
  RETURN instances_created;
END;
$$;