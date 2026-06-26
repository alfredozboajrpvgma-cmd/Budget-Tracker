-- Run this in your Supabase SQL Editor

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Create a function that triggers the edge function using pg_net
CREATE OR REPLACE FUNCTION trigger_cron_notifications()
RETURNS void AS $$
BEGIN
  -- Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference ID
  -- Replace 'YOUR_SERVICE_ROLE_KEY' with your actual Supabase service_role key
  perform net.http_post(
      url:='https://dtzsyurynhtrvkajhxka.supabase.co/functions/v1/cron-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Schedule the cron job to run every minute
-- Note: 'cron_notifications_job' is an arbitrary name for the job
SELECT cron.schedule(
    'cron_notifications_job',  -- name of the cron job
    '* * * * *',               -- run every minute
    'SELECT trigger_cron_notifications();'
);

-- To unschedule the job later if needed, run:
-- SELECT cron.unschedule('cron_notifications_job');
