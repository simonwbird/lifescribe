-- Phase 2: People-Specific Prompts Schema Updates

-- First, let's expand the relationship_type enum to include all family relationship roles
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'child';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'sibling';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'brother';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'sister';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'grandparent';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'grandmother';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'grandfather';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'grandchild';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'grandson';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'granddaughter';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'aunt';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'uncle';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'niece';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'nephew';
ALTER TYPE relationship_type ADD VALUE IF NOT EXISTS 'cousin';

-- Function to get a person's primary relationship role based on their relationships
CREATE OR REPLACE FUNCTION public.get_person_relationship_role(p_person_id uuid, p_family_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  primary_role text;
  role_count integer;
BEGIN
  -- Get the most significant relationship role for this person
  -- Priority order: parent > grandparent > spouse > sibling > child > grandchild
  
  -- Check for parent role
  SELECT COUNT(*) INTO role_count
  FROM relationships r
  WHERE r.from_person_id = p_person_id 
    AND r.relationship_type = 'parent'
    AND EXISTS (
      SELECT 1 FROM people p 
      WHERE p.id IN (r.from_person_id, r.to_person_id) 
      AND p.family_id = p_family_id
    );
  
  IF role_count > 0 THEN
    RETURN 'parent';
  END IF;
  
  -- Check for grandparent role
  SELECT COUNT(*) INTO role_count
  FROM relationships r
  WHERE r.from_person_id = p_person_id 
    AND r.relationship_type IN ('grandparent', 'grandmother', 'grandfather')
    AND EXISTS (
      SELECT 1 FROM people p 
      WHERE p.id IN (r.from_person_id, r.to_person_id) 
      AND p.family_id = p_family_id
    );
  
  IF role_count > 0 THEN
    RETURN 'grandparent';
  END IF;
  
  -- Check for spouse role
  SELECT COUNT(*) INTO role_count
  FROM relationships r
  WHERE r.from_person_id = p_person_id 
    AND r.relationship_type = 'spouse'
    AND EXISTS (
      SELECT 1 FROM people p 
      WHERE p.id IN (r.from_person_id, r.to_person_id) 
      AND p.family_id = p_family_id
    );
  
  IF role_count > 0 THEN
    RETURN 'spouse';
  END IF;
  
  -- Check for sibling role
  SELECT COUNT(*) INTO role_count
  FROM relationships r
  WHERE r.from_person_id = p_person_id 
    AND r.relationship_type IN ('sibling', 'brother', 'sister')
    AND EXISTS (
      SELECT 1 FROM people p 
      WHERE p.id IN (r.from_person_id, r.to_person_id) 
      AND p.family_id = p_family_id
    );
  
  IF role_count > 0 THEN
    RETURN 'sibling';
  END IF;
  
  -- Default to 'child' if no other roles found
  RETURN 'child';
END;
$$;

-- Function to generate person-specific prompt instances
CREATE OR REPLACE FUNCTION public.generate_person_prompt_instances(p_person_id uuid, p_family_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_role text;
  prompt_record RECORD;
  instances_created integer := 0;
  combo_person_ids uuid[];
  existing_instance_id uuid;
BEGIN
  -- Get the person's primary relationship role
  person_role := get_person_relationship_role(p_person_id, p_family_id);
  
  -- Generate instances for person-specific prompts matching this role
  FOR prompt_record IN 
    SELECT * FROM prompts 
    WHERE scope = 'person_specific' 
    AND person_role = person_role
    AND enabled = true
  LOOP
    -- Handle combo prompts (siblings_combo, parents_combo, children_combo)
    IF prompt_record.slug LIKE '%_combo' THEN
      CASE 
        WHEN prompt_record.slug = 'siblings_combo' THEN
          -- Get all siblings for this person
          SELECT array_agg(DISTINCT p.id) INTO combo_person_ids
          FROM people p
          JOIN relationships r1 ON (r1.from_person_id = p.id OR r1.to_person_id = p.id)
          JOIN relationships r2 ON (r2.from_person_id = p_person_id OR r2.to_person_id = p_person_id)
          WHERE p.family_id = p_family_id
            AND p.id != p_person_id
            AND r1.relationship_type IN ('sibling', 'brother', 'sister')
            AND r2.relationship_type IN ('sibling', 'brother', 'sister')
            AND (
              (r1.from_person_id = r2.from_person_id AND r1.to_person_id != r2.to_person_id) OR
              (r1.to_person_id = r2.to_person_id AND r1.from_person_id != r2.from_person_id)
            );
            
        WHEN prompt_record.slug = 'parents_combo' THEN
          -- Get all parents for this person
          SELECT array_agg(DISTINCT 
            CASE 
              WHEN r.from_person_id != p_person_id THEN r.from_person_id
              ELSE r.to_person_id
            END
          ) INTO combo_person_ids
          FROM relationships r
          JOIN people p ON (p.id = r.from_person_id OR p.id = r.to_person_id)
          WHERE (r.from_person_id = p_person_id OR r.to_person_id = p_person_id)
            AND r.relationship_type = 'parent'
            AND p.family_id = p_family_id
            AND p.id != p_person_id;
            
        WHEN prompt_record.slug = 'children_combo' THEN
          -- Get all children for this person
          SELECT array_agg(DISTINCT 
            CASE 
              WHEN r.from_person_id != p_person_id THEN r.from_person_id
              ELSE r.to_person_id
            END
          ) INTO combo_person_ids
          FROM relationships r
          JOIN people p ON (p.id = r.from_person_id OR p.id = r.to_person_id)
          WHERE (r.from_person_id = p_person_id OR r.to_person_id = p_person_id)
            AND r.relationship_type = 'child'
            AND p.family_id = p_family_id
            AND p.id != p_person_id;
      END CASE;
      
      -- Check if combo instance already exists
      IF combo_person_ids IS NOT NULL AND array_length(combo_person_ids, 1) > 0 THEN
        SELECT id INTO existing_instance_id
        FROM prompt_instances
        WHERE prompt_id = prompt_record.id
          AND family_id = p_family_id
          AND person_ids = combo_person_ids
        LIMIT 1;
        
        IF existing_instance_id IS NULL THEN
          INSERT INTO prompt_instances (
            prompt_id, family_id, source, status, person_ids
          ) VALUES (
            prompt_record.id, p_family_id, 'person_specific', 'open', combo_person_ids
          );
          instances_created := instances_created + 1;
        END IF;
      END IF;
      
    ELSE
      -- Individual person prompt
      -- Check if instance already exists for this person
      SELECT id INTO existing_instance_id
      FROM prompt_instances
      WHERE prompt_id = prompt_record.id
        AND family_id = p_family_id
        AND person_ids = ARRAY[p_person_id]
      LIMIT 1;
      
      IF existing_instance_id IS NULL THEN
        INSERT INTO prompt_instances (
          prompt_id, family_id, source, status, person_ids
        ) VALUES (
          prompt_record.id, p_family_id, 'person_specific', 'open', ARRAY[p_person_id]
        );
        instances_created := instances_created + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN instances_created;
END;
$$;

-- Trigger to automatically generate person-specific prompts when people are created/updated
CREATE OR REPLACE FUNCTION public.trigger_generate_person_prompts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate prompts for the person being created/updated
  PERFORM generate_person_prompt_instances(NEW.id, NEW.family_id);
  
  -- Also regenerate for related people in case relationships changed
  PERFORM generate_person_prompt_instances(r.from_person_id, NEW.family_id)
  FROM relationships r
  WHERE r.to_person_id = NEW.id;
  
  PERFORM generate_person_prompt_instances(r.to_person_id, NEW.family_id)
  FROM relationships r
  WHERE r.from_person_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on people table
DROP TRIGGER IF EXISTS trigger_people_generate_prompts ON people;
CREATE TRIGGER trigger_people_generate_prompts
  AFTER INSERT OR UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_person_prompts();

-- Create trigger on relationships table to regenerate when relationships change
CREATE OR REPLACE FUNCTION public.trigger_relationship_prompt_regen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family_id_val uuid;
BEGIN
  -- Get family_id from one of the people in the relationship
  IF TG_OP = 'DELETE' THEN
    SELECT family_id INTO family_id_val FROM people WHERE id = OLD.from_person_id LIMIT 1;
    
    -- Regenerate prompts for both people
    PERFORM generate_person_prompt_instances(OLD.from_person_id, family_id_val);
    PERFORM generate_person_prompt_instances(OLD.to_person_id, family_id_val);
    
    RETURN OLD;
  ELSE
    SELECT family_id INTO family_id_val FROM people WHERE id = NEW.from_person_id LIMIT 1;
    
    -- Regenerate prompts for both people
    PERFORM generate_person_prompt_instances(NEW.from_person_id, family_id_val);
    PERFORM generate_person_prompt_instances(NEW.to_person_id, family_id_val);
    
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trigger_relationships_generate_prompts ON relationships;
CREATE TRIGGER trigger_relationships_generate_prompts
  AFTER INSERT OR UPDATE OR DELETE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION trigger_relationship_prompt_regen();