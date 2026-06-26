-- Security hardening for PinkCloud
-- Run in Supabase SQL Editor after schema.sql

-- 1. Stop shared members from editing entire goal rows (title, target, owner, etc.)
DROP POLICY IF EXISTS "Users can update goals" ON public.goals;
CREATE POLICY "Owners can update goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Safe goal contributions (owner + shared members)
CREATE OR REPLACE FUNCTION public.contribute_to_goal(p_goal_id UUID, p_amount REAL)
RETURNS JSONB AS $$
DECLARE
  v_goal public.goals%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not logged in';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  SELECT * INTO v_goal FROM public.goals WHERE id = p_goal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  IF v_goal.user_id <> v_user_id
     AND NOT (COALESCE(v_goal.shared_with, '[]'::jsonb) @> to_jsonb(ARRAY[v_user_id::text])) THEN
    RAISE EXCEPTION 'Not allowed to contribute to this goal';
  END IF;

  UPDATE public.goals
  SET current_amount = LEAST(
    COALESCE(target_amount, 0),
    COALESCE(current_amount, 0) + p_amount
  )
  WHERE id = p_goal_id;

  INSERT INTO public.savings (user_id, goal_id, amount)
  VALUES (v_user_id, p_goal_id, p_amount);

  SELECT * INTO v_goal FROM public.goals WHERE id = p_goal_id;
  RETURN to_jsonb(v_goal);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.contribute_to_goal(UUID, REAL) TO authenticated;

-- 3. Public profile lookup without exposing emails
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id UUID)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'avatar_seed', avatar_seed,
    'level', level,
    'level_title', level_title,
    'created_at', created_at
  )
  FROM public.users
  WHERE id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_public_profile(UUID) TO authenticated, anon;

-- 4. Hide emails from direct table queries (use auth session for own email)
REVOKE SELECT (email) ON public.users FROM authenticated, anon;
