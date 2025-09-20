-- Schedule collision detection to run every hour
SELECT cron.schedule(
  'collision-detector-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/collision-detector',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);