-- NOTE: If signup returns 500 with "Error sending confirmation email",
-- this SQL will NOT fix it. Configure SMTP in Supabase Auth settings,
-- or disable "Confirm email" under Authentication → Providers → Email.

-- Fix "Database error saving new user" on /auth/v1/signup
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

-- 1. Robust profile creation when auth.users row is inserted
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, public.users.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
