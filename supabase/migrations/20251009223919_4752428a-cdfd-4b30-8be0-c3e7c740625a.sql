-- Add trigger to automatically log person changes to audit_log

-- Function to log person changes
CREATE OR REPLACE FUNCTION public.log_person_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type audit_action_type;
BEGIN
  -- Determine action type
  CASE TG_OP
    WHEN 'INSERT' THEN
      action_type := 'PERSON_CREATED';
    WHEN 'UPDATE' THEN
      action_type := 'PERSON_UPDATED';
    WHEN 'DELETE' THEN
      action_type := 'PERSON_DELETED';
  END CASE;
  
  -- Log the audit event using the existing log_audit_event function
  PERFORM log_audit_event(
    p_actor_id := auth.uid(),
    p_action := action_type,
    p_entity_type := 'person',
    p_entity_id := CASE TG_OP 
      WHEN 'DELETE' THEN OLD.id 
      ELSE NEW.id 
    END,
    p_family_id := CASE TG_OP 
      WHEN 'DELETE' THEN OLD.family_id 
      ELSE NEW.family_id 
    END,
    p_before_values := CASE TG_OP 
      WHEN 'UPDATE' THEN to_jsonb(OLD)
      WHEN 'DELETE' THEN to_jsonb(OLD)
      ELSE '{}'::jsonb
    END,
    p_after_values := CASE TG_OP
      WHEN 'INSERT' THEN to_jsonb(NEW)
      WHEN 'UPDATE' THEN to_jsonb(NEW)
      ELSE '{}'::jsonb
    END
  );
  
  RETURN CASE TG_OP 
    WHEN 'DELETE' THEN OLD 
    ELSE NEW 
  END;
END;
$$;

-- Create trigger for people table
DROP TRIGGER IF EXISTS log_person_changes_trigger ON public.people;
CREATE TRIGGER log_person_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.people
  FOR EACH ROW
  EXECUTE FUNCTION public.log_person_change();

-- Add PERSON actions to audit_action_type enum if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PERSON_CREATED' AND enumtypid = 'audit_action_type'::regtype) THEN
    ALTER TYPE audit_action_type ADD VALUE 'PERSON_CREATED';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PERSON_UPDATED' AND enumtypid = 'audit_action_type'::regtype) THEN
    ALTER TYPE audit_action_type ADD VALUE 'PERSON_UPDATED';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PERSON_MERGED' AND enumtypid = 'audit_action_type'::regtype) THEN
    ALTER TYPE audit_action_type ADD VALUE 'PERSON_MERGED';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PERSON_DELETED' AND enumtypid = 'audit_action_type'::regtype) THEN
    ALTER TYPE audit_action_type ADD VALUE 'PERSON_DELETED';
  END IF;
END $$;