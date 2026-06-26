-- Cap dream savings at target amount (fix display like 11k/10k -> 10k/10k)
-- Run in Supabase SQL Editor

UPDATE public.goals
SET current_amount = LEAST(COALESCE(current_amount, 0), COALESCE(target_amount, 0))
WHERE COALESCE(current_amount, 0) > COALESCE(target_amount, 0);

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
