import type { CronMessage } from './cronMessages.ts';
import { CRON_MESSAGES } from './cronMessages.ts';

export interface UserNotificationContext {
  userId: string;
  name: string;
  monthlyBudget: number;
  monthlyExpenses: number;
  monthlySavings: number;
  budgetUsedPercent: number;
  sunshineScore: number;
  savingStreak: number;
  questsCompleted: number;
  lastActiveAt: Date | null;
  lastExpenseAt: Date | null;
  lastSavingAt: Date | null;
  expenseLoggedToday: boolean;
}

function daysSince(date: Date | null): number {
  if (!date) return Infinity;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

function inHourWindow(hour: number, windowMinutes = 5): boolean {
  const now = new Date();
  return now.getUTCHours() === hour && now.getUTCMinutes() < windowMinutes;
}

function personalize(text: string, name: string): string {
  return text.replace(/\{name\}/g, name || 'Dreamer');
}

function pickMotivationalToday(sentTodayIds: Set<string>): CronMessage | null {
  const pool = CRON_MESSAGES.filter(m => m.condition === 'motivational');
  const available = pool.filter(m => !sentTodayIds.has(m.id));
  if (available.length === 0) return null;
  const dayIndex = new Date().getUTCDate() % available.length;
  return available[dayIndex];
}

export function matchesCondition(message: CronMessage, ctx: UserNotificationContext): boolean {
  const now = new Date();
  const inactiveDays = daysSince(ctx.lastActiveAt);
  const expenseInactive = daysSince(ctx.lastExpenseAt);
  const savingInactive = daysSince(ctx.lastSavingAt);

  switch (message.condition) {
    case 'scheduled':
      return message.hour !== undefined && inHourWindow(message.hour);

    case 'inactive':
      return inactiveDays >= (message.inactiveMinDays ?? 0)
        && inactiveDays < (message.inactiveMaxDays ?? Infinity);

    case 'no_expense_inactive':
      return expenseInactive >= (message.inactiveMinDays ?? 0)
        && expenseInactive < (message.inactiveMaxDays ?? Infinity);

    case 'no_savings_inactive':
      return savingInactive >= (message.inactiveMinDays ?? 0)
        && savingInactive < (message.inactiveMaxDays ?? Infinity);

    case 'budget_warning':
      return ctx.monthlyBudget > 0 && ctx.budgetUsedPercent >= (message.budgetThreshold ?? 100);

    case 'no_budget':
      return ctx.monthlyBudget <= 0;

    case 'no_expense_today':
      if (message.hour !== undefined && !inHourWindow(message.hour)) return false;
      return !ctx.expenseLoggedToday;

    case 'quests_incomplete':
      if (message.hour !== undefined && !inHourWindow(message.hour)) return false;
      return ctx.questsCompleted < 3;

    case 'low_sunshine':
      return ctx.sunshineScore < 15 && ctx.monthlyExpenses > 0;

    case 'streak_active':
      if (message.hour !== undefined && !inHourWindow(message.hour)) return false;
      return ctx.savingStreak >= 3;

    case 'weekly':
      if (message.dayOfWeek !== undefined && now.getUTCDay() !== message.dayOfWeek) return false;
      return message.hour !== undefined && inHourWindow(message.hour);

    case 'monthly_start':
      if (now.getUTCDate() !== 1) return false;
      return message.hour !== undefined && inHourWindow(message.hour);

    case 'monthly_mid':
      if (now.getUTCDate() !== 15) return false;
      return message.hour !== undefined && inHourWindow(message.hour);

    case 'motivational':
      return message.hour !== undefined && inHourWindow(message.hour);

    default:
      return false;
  }
}

export function canSendMessage(
  messageId: string,
  cooldownHours: number,
  lastSentAt: Date | null,
): boolean {
  if (!lastSentAt) return true;
  return Date.now() - lastSentAt.getTime() >= cooldownHours * 60 * 60 * 1000;
}

export function selectMessagesForUser(
  ctx: UserNotificationContext,
  sentLog: Map<string, Date>,
  sentTodayIds: Set<string>,
): { id: string; title: string; body: string }[] {
  const motivational = pickMotivationalToday(sentTodayIds);
  const pool = motivational
    ? [...CRON_MESSAGES.filter(m => m.condition !== 'motivational'), motivational]
    : CRON_MESSAGES.filter(m => m.condition !== 'motivational');

  const priority = [
    ...pool.filter(m => ['budget_warning', 'no_budget', 'low_sunshine'].includes(m.condition)),
    ...pool.filter(m => !['inactive', 'no_expense_inactive', 'no_savings_inactive', 'budget_warning', 'no_budget', 'low_sunshine', 'motivational'].includes(m.condition)),
    ...pool.filter(m => ['inactive', 'no_expense_inactive', 'no_savings_inactive'].includes(m.condition)),
    ...(motivational ? [motivational] : []),
  ];

  const results: { id: string; title: string; body: string }[] = [];

  for (const message of priority) {
    if (results.length >= 1) break;
    if (!canSendMessage(message.id, message.cooldownHours, sentLog.get(message.id) ?? null)) continue;
    if (!matchesCondition(message, ctx)) continue;
    results.push({
      id: message.id,
      title: personalize(message.title, ctx.name),
      body: personalize(message.body, ctx.name),
    });
  }

  return results;
}

export function calculateSpendingIntensity(monthlyExpenses: number, monthlyBudget: number): number {
  if (monthlyBudget > 0) {
    return Math.min(100, Math.round((monthlyExpenses / monthlyBudget) * 100));
  }
  if (monthlyExpenses <= 0) return 0;
  return Math.min(100, Math.round(monthlyExpenses / 200));
}

export function calculateSunshineScore(spendingIntensity: number, savingStreak: number): number {
  const streakBonus = Math.min(30, savingStreak * 3);
  return Math.max(0, Math.min(100, 100 - spendingIntensity + streakBonus));
}
