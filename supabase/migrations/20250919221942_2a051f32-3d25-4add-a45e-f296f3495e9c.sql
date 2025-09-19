-- Create the date_localisation_v1 feature flag
INSERT INTO public.feature_flags (
  name,
  key, 
  description,
  status,
  rollout_percentage,
  rollout_type,
  is_kill_switch,
  created_by
) VALUES (
  'Date Localization v1',
  'date_localisation_v1',
  'Enable locale-aware date formatting with timezone support',
  'draft',
  0,
  'global',
  true,
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (key) DO NOTHING;

-- Create targeting rules for staff rollout (Phase 1)
INSERT INTO public.feature_flag_targeting (
  flag_id,
  targeting_type,
  targeting_value,
  rollout_percentage,
  is_enabled
) 
SELECT 
  ff.id,
  'role',
  '["super_admin", "admin"]',
  100,
  false -- Will be enabled when ready for Phase 1
FROM public.feature_flags ff 
WHERE ff.key = 'date_localisation_v1'
ON CONFLICT DO NOTHING;

-- Create remote config for observability settings
INSERT INTO public.remote_config (
  key,
  name,
  description,
  value_type,
  default_value,
  current_value,
  is_active,
  created_by
) VALUES 
(
  'date_render_sampling_rate',
  'Date Render Sampling Rate',
  'Percentage of date renders to sample for metrics (0-100)',
  'number',
  1.0,
  1.0,
  true,
  '00000000-0000-0000-0000-000000000000'
),
(
  'auto_rollback_error_threshold',
  'Auto-rollback Error Threshold',
  'Number of timezone/intl errors per minute before auto-rollback',
  'number',
  10,
  10,
  true,
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (key) DO NOTHING;