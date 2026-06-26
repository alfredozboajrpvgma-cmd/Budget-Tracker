import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  deleteExpense,
  updateUser,
  getUserById,
  upsertQuestProgress,
} from '../db.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { checkLevelUp } from './auth.js';

const router = Router();

function formatExpense(e: ReturnType<typeof getExpenses>[0]) {
  const created = new Date(e.created_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
  let dateLabel: string;
  if (diffDays === 0) dateLabel = 'Today';
  else if (diffDays === 1) dateLabel = 'Yesterday';
  else dateLabel = created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    id: e.id,
    amount: e.amount,
    category: e.category,
    note: e.note,
    date: dateLabel,
    createdAt: e.created_at,
  };
}

router.get('/', requireAuth, (req: AuthRequest, res) => {
  const expenses = getExpenses(req.userId!).map(formatExpense);
  res.json({ expenses });
});

router.post('/', requireAuth, (req: AuthRequest, res) => {
  const { amount, category, note } = req.body as { amount?: number; category?: string; note?: string };
  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Valid amount required' });
    return;
  }
  if (!category) {
    res.status(400).json({ error: 'Category required' });
    return;
  }

  const expense = createExpense(req.userId!, {
    amount,
    category,
    note: note ?? '',
  });

  const user = getUserById(req.userId!)!;
  const newXp = user.xp + 10;
  updateUser(req.userId!, { xp: newXp });
  upsertQuestProgress(req.userId!, 'log-expense', true, 1);

  const levelResult = checkLevelUp(req.userId!, newXp, user.level);

  res.json({
    expense: formatExpense(expense),
    xpGained: 10,
    ...levelResult,
  });
});

router.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  const ok = deleteExpense(req.params.id, req.userId!);
  if (!ok) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
