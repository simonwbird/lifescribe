-- Fix ambiguous column reference in log_audit_event function
CREATE OR REPLACE FUNCTION public.log_audit_event(p_actor_id uuid DEFAULT NULL::uuid, p_actor_type text DEFAULT 'user'::text, p_action audit_action_type DEFAULT 'STORY_VIEW'::audit_action_type, p_entity_type text DEFAULT 'unknown'::text, p_entity_id uuid DEFAULT NULL::uuid, p_family_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_session_id text DEFAULT NULL::text, p_details jsonb DEFAULT '{}'::jsonb, p_before_values jsonb DEFAULT '{}'::jsonb, p_after_values jsonb DEFAULT '{}'::jsonb, p_risk_score integer DEFAULT 0)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  audit_id uuid;
  previous_hash text;
  calculated_hash text;
  current_sequence bigint;
BEGIN
  -- Get the last hash for chain integrity
  SELECT audit_log.current_hash INTO previous_hash
  FROM public.audit_log
  ORDER BY sequence_number DESC
  LIMIT 1;
  
  -- Get next sequence number
  SELECT nextval('audit_log_sequence_number_seq') INTO current_sequence;
  
  -- Calculate current hash
  calculated_hash := calculate_audit_hash(
    current_sequence,
    p_actor_id,
    p_action::text,
    p_entity_type,
    p_entity_id,
    p_details,
    previous_hash
  );
  
  -- Insert audit log entry
  INSERT INTO public.audit_log (
    actor_id,
    actor_type,
    action,
    entity_type,
    entity_id,
    family_id,
    ip_address,
    user_agent,
    session_id,
    details,
    before_values,
    after_values,
    risk_score,
    previous_hash,
    current_hash
  ) VALUES (
    p_actor_id,
    p_actor_type,
    p_action,
    p_entity_type,
    p_entity_id,
    p_family_id,
    p_ip_address,
    p_user_agent,
    p_session_id,
    p_details,
    p_before_values,
    p_after_values,
    p_risk_score,
    previous_hash,
    calculated_hash
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$function$;