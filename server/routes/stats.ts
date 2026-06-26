import { Router } from 'express';
import {
  getUserById,
  getGoals,
  getMonthlyExpenses,
  getMonthlySavings,
  getTodaySavings,
  getCategoryBreakdown,
  getQuestProgress,
} from '../db.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { xpForLevel } from './auth.js';

function calculateSpendingIntensity(monthlyExpenses: number, monthlyBudget: number): number {
  if (monthlyBudget > 0) {
    return Math.min(100, Math.round((monthlyExpenses / monthlyBudget) * 100));
  }
  if (monthlyExpenses <= 0) return 0;
  return Math.min(100, Math.round(monthlyExpenses / 200));
}

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const user = getUserById(userId)!;
  const goals = getGoals(userId);
  const monthlyExpenses = getMonthlyExpenses(userId);
  const monthlySavings = getMonthlySavings(userId);
  const todaySavings = getTodaySavings(userId);
  const categories = getCategoryBreakdown(userId);
  const quests = getQuestProgress(userId);

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const activeGoals = goals.filter(g => (g.current_amount / g.target_amount) < 1);
  const dreamProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((s, g) => s + Math.min(100, (g.current_amount / g.target_amount) * 100), 0) / activeGoals.length)
    : 0;

  const budgetUsed = user.monthly_budget > 0
    ? Math.min(100, Math.round((monthlyExpenses / user.monthly_budget) * 100))
    : 0;
  const remainingBalance = Math.max(0, user.monthly_budget - monthlyExpenses);

  const xpNeeded = xpForLevel(user.level);
  const xpProgress = Math.min(100, Math.round((user.xp / xpNeeded) * 100));

  const maxCategory = categories[0]?.total ?? 1;
  const categoryBreakdown = categories.map(c => ({
    category: c.category,
    total: c.total,
    percent: Math.round((c.total / maxCategory) * 100),
  }));

  const spendingIntensity = calculateSpendingIntensity(monthlyExpenses, user.monthly_budget);

  let rainLabel = 'Clear Skies';
  if (spendingIntensity > 70) rainLabel = 'Stormy';
  else if (spendingIntensity > 40) rainLabel = 'Rainy';
  else if (spendingIntensity > 15) rainLabel = 'Drizzle';

  const sunshineScore = Math.max(0, Math.min(100, 100 - spendingIntensity + Math.min(30, user.saving_streak * 3)));

  const questMap = Object.fromEntries(quests.map(q => [q.quest_id, q]));

  res.json({
    totalBalance: remainingBalance,
    monthlyBudget: user.monthly_budget,
    monthlyExpenses,
    monthlySavings,
    todaySavings,
    budgetUsedPercent: budgetUsed,
    savingsProgressPercent: user.monthly_budget > 0
      ? Math.min(100, Math.round((monthlySavings / (user.monthly_budget * 0.2)) * 100))
      : 0,
    totalSaved,
    dreamProgressPercent: dreamProgress,
    xp: user.xp,
    xpNeeded,
    xpProgressPercent: xpProgress,
    level: user.level,
    levelTitle: user.level_title,
    savingStreak: user.saving_streak,
    sunshineScore,
    spendingIntensity,
    rainLabel,
    categoryBreakdown,
    quests: {
      logExpense: { completed: !!questMap['log-expense']?.completed, progress: questMap['log-expense']?.progress_amount ?? 0 },
      save50: { completed: !!questMap['save-50']?.completed, progress: todaySavings, target: 50 },
      noSpending: { completed: !!questMap['no-spending']?.completed, locked: monthlyExpenses > 0 },
    },
    questsCompleted: [
      questMap['log-expense']?.completed,
      questMap['save-50']?.completed,
      questMap['no-spending']?.completed,
    ].filter(Boolean).length,
  });
});

export default router;
