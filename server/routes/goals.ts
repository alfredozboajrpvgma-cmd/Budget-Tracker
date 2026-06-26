import { Router } from 'express';
import {
  getGoals,
  createGoal,
  getGoalById,
  updateGoalAmount,
  deleteGoal,
  createSaving,
  updateUser,
  getUserById,
  upsertQuestProgress,
  getTodaySavings,
} from '../db.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { checkLevelUp } from './auth.js';

const router = Router();

function formatGoal(g: ReturnType<typeof getGoalById>) {
  if (!g) return null;
  const progress = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
  return {
    id: g.id,
    title: g.title,
    type: g.type,
    targetAmount: g.target_amount,
    currentAmount: g.current_amount,
    progress,
    createdAt: g.created_at,
  };
}

router.get('/', requireAuth, (req: AuthRequest, res) => {
  const goals = getGoals(req.userId!).map(g => formatGoal(g)!);
  res.json({ goals });
});

router.post('/', requireAuth, (req: AuthRequest, res) => {
  const { title, type, targetAmount } = req.body as { title?: string; type?: string; targetAmount?: number };
  if (!title?.trim()) {
    res.status(400).json({ error: 'Title required' });
    return;
  }
  const goal = createGoal(req.userId!, {
    title: title.trim(),
    type: type ?? 'Other',
    targetAmount: targetAmount ?? 10000,
  });
  const user = getUserById(req.userId!)!;
  const newXp = user.xp + 15;
  updateUser(req.userId!, { xp: newXp });
  const levelResult = checkLevelUp(req.userId!, newXp, user.level);
  res.json({ goal: formatGoal(goal), xpGained: 15, ...levelResult });
});

router.post('/:id/contribute', requireAuth, (req: AuthRequest, res) => {
  const { amount } = req.body as { amount?: number };
  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Valid amount required' });
    return;
  }
  const goal = getGoalById(req.params.id);
  if (!goal || goal.user_id !== req.userId) {
    res.status(404).json({ error: 'Goal not found' });
    return;
  }

  createSaving(req.userId!, goal.id, amount);
  const updated = updateGoalAmount(goal.id, amount)!;

  const user = getUserById(req.userId!)!;
  const newXp = user.xp + Math.min(50, Math.round(amount / 10));
  updateUser(req.userId!, { xp: newXp });

  const todayTotal = getTodaySavings(req.userId!);
  upsertQuestProgress(req.userId!, 'save-50', todayTotal >= 50, todayTotal);

  const today = new Date().toISOString().slice(0, 10);
  const lastSave = user.last_save_date;
  let streak = user.saving_streak;
  if (lastSave !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    streak = lastSave === yesterdayStr ? streak + 1 : 1;
    updateUser(req.userId!, { saving_streak: streak, last_save_date: today });
  }

  const levelResult = checkLevelUp(req.userId!, newXp, user.level);
  const xpGained = Math.min(50, Math.round(amount / 10));

  res.json({
    goal: formatGoal(updated),
    xpGained,
    streak,
    ...levelResult,
  });
});

router.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  const ok = deleteGoal(req.params.id, req.userId!);
  if (!ok) {
    res.status(404).json({ error: 'Goal not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
