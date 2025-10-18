-- Insert the signups_enabled feature flag
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
  'Signups Enabled',
  'signups_enabled',
  'Controls whether new users can sign up for the platform. When disabled, the signup page will show a maintenance message.',
  'active',
  100,
  'global',
  true,
  (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT (key) DO NOTHING;