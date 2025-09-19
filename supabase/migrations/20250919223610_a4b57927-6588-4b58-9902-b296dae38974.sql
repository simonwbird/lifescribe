-- Insert settings with proper created_by field using the family creator
INSERT INTO public.weekly_digest_settings (
  family_id, 
  enabled, 
  delivery_day, 
  delivery_hour,
  created_by
)
SELECT 
  f.id as family_id,
  true as enabled,
  0 as delivery_day, -- Sunday
  9 as delivery_hour, -- 9 AM
  f.created_by as created_by
FROM public.families f
LEFT JOIN public.weekly_digest_settings wds ON f.id = wds.family_id
WHERE wds.family_id IS NULL;