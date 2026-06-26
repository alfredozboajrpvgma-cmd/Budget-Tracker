-- Run this script in your Supabase project's SQL Editor

-- 1. Create the Users table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT DEFAULT '',
  avatar_seed TEXT DEFAULT 'Felix',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  level_title TEXT DEFAULT 'Cloud Builder',
  monthly_budget REAL DEFAULT 5000,
  onboarding_complete BOOLEAN DEFAULT false,
  saving_streak INTEGER DEFAULT 0,
  last_save_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'Other',
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  share_code TEXT UNIQUE,
  shared_with JSONB DEFAULT '[]'::jsonb,
  currency_symbol TEXT DEFAULT '₱',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create the Savings table
CREATE TABLE public.savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Quest Progress table
CREATE TABLE public.quest_progress (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  progress_amount REAL DEFAULT 0,
  PRIMARY KEY (user_id, quest_id)
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies
-- Users can read any profile (needed to show owner names on shared dreams)
CREATE POLICY "Users can read any profile" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Users can do all operations on their own data
-- Goals: split policies so joinGoal can find goals by share_code across users
CREATE POLICY "Users can select goals" ON public.goals FOR SELECT USING (true);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own savings" ON public.savings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own quest progress" ON public.quest_progress FOR ALL USING (auth.uid() = user_id);

-- 8. Create a trigger to auto-create user profile when signing up via Supabase Auth
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 9. RPC function for joining a goal by share code (bypasses RLS)
CREATE OR REPLACE FUNCTION public.join_goal_by_code(p_share_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_goal RECORD;
  v_owner_name TEXT;
  v_user_id UUID;
  v_shared JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not logged in';
  END IF;

  SELECT * INTO v_goal FROM public.goals WHERE share_code = UPPER(TRIM(p_share_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dream not found. Check the code and try again.';
  END IF;

  SELECT name INTO v_owner_name FROM public.users WHERE id = v_goal.user_id;

  IF v_goal.user_id = v_user_id THEN
    RAISE EXCEPTION 'You already own this dream!';
  END IF;

  v_shared := COALESCE(v_goal.shared_with, '[]'::jsonb);
  IF v_shared @> to_jsonb(ARRAY[v_user_id::text]) THEN
    RAISE EXCEPTION 'You have already joined this dream!';
  END IF;

  -- Add user to shared_with
  v_shared := v_shared || to_jsonb(ARRAY[v_user_id::text]);
  UPDATE public.goals SET shared_with = v_shared WHERE id = v_goal.id;

  RETURN jsonb_build_object(
    'id', v_goal.id,
    'title', v_goal.title,
    'type', v_goal.type,
    'current_amount', v_goal.current_amount,
    'target_amount', v_goal.target_amount,
    'share_code', v_goal.share_code,
    'shared_with', v_shared,
    'created_at', v_goal.created_at,
    'user_id', v_goal.user_id,
    'users', jsonb_build_object('name', v_owner_name),
    'currency_symbol', v_goal.currency_symbol
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Secure goal contributions
CREATE OR REPLACE FUNCTION public.contribute_to_goal(p_goal_id UUID, p_amount REAL)
RETURNS JSONB AS $$
DECLARE
  v_goal public.goals%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not logged in'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

  SELECT * INTO v_goal FROM public.goals WHERE id = p_goal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Goal not found'; END IF;

  IF v_goal.user_id <> v_user_id
     AND NOT (COALESCE(v_goal.shared_with, '[]'::jsonb) @> to_jsonb(ARRAY[v_user_id::text])) THEN
    RAISE EXCEPTION 'Not allowed to contribute to this goal';
  END IF;

  UPDATE public.goals SET current_amount = LEAST(COALESCE(target_amount, 0), COALESCE(current_amount, 0) + p_amount) WHERE id = p_goal_id;
  INSERT INTO public.savings (user_id, goal_id, amount) VALUES (v_user_id, p_goal_id, p_amount);
  SELECT * INTO v_goal FROM public.goals WHERE id = p_goal_id;
  RETURN to_jsonb(v_goal);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.contribute_to_goal(UUID, REAL) TO authenticated;

-- 11. Public profile lookup (no email exposure)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id UUID)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'id', id, 'name', name, 'avatar_seed', avatar_seed,
    'level', level, 'level_title', level_title, 'created_at', created_at
  ) FROM public.users WHERE id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_public_profile(UUID) TO authenticated, anon;

REVOKE SELECT (email) ON public.users FROM authenticated, anon;
