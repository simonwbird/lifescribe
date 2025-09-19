-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.create_queue_item_from_flag()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.moderation_queue_items (
    flag_id,
    family_id,
    item_type,
    item_id,
    priority,
    sla_due_at
  ) VALUES (
    NEW.id,
    NEW.family_id,
    NEW.item_type,
    NEW.item_id,
    NEW.severity,
    now() + interval '24 hours' -- Default 24h SLA
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;