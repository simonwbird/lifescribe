-- Insert default settings for families that don't have them
INSERT INTO public.weekly_digest_settings (family_id, enabled, delivery_day, delivery_hour)
SELECT 
  f.id as family_id,
  true as enabled,
  0 as delivery_day, -- Sunday
  9 as delivery_hour -- 9 AM
FROM public.families f
LEFT JOIN public.weekly_digest_settings wds ON f.id = wds.family_id
WHERE wds.family_id IS NULL;