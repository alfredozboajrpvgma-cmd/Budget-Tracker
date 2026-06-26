-- Run in Supabase SQL Editor (after main schema.sql)

-- Push subscription storage (Web Push — works when tab is closed)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cooldown tracking for cron messages
CREATE TABLE IF NOT EXISTS public.notification_sent_log (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, message_id)
);

-- Server-side activity tracking (inactivity detection)
CREATE TABLE IF NOT EXISTS public.user_activity (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_expense_at TIMESTAMPTZ,
  last_saving_at TIMESTAMPTZ,
  notifications_enabled BOOLEAN DEFAULT true NOT NULL
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_sent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own notification log"
  ON public.notification_sent_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own activity"
  ON public.user_activity FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
