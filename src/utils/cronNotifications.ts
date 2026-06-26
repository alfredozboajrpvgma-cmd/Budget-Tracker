import type { CronMessage } from '../data/cronMessages';
import { CRON_MESSAGES } from '../data/cronMessages';
import type { Expense, Goal, Stats, User } from '../types';
import { sendNotification, areNotificationsEnabled } from './notifications';

const LAST_ACTIVE_KEY = 'pinkcloud_last_active';
const LAST_EXPENSE_KEY = 'pinkcloud_last_expense_at';
const LAST_SAVING_KEY = 'pinkcloud_last_saving_at';
const CRON_SENT_KEY = 'pinkcloud_cron_sent';
const MOTIVATIONAL_DAY_KEY = 'pinkcloud_motivational_day';

export interface CronContext {
  user: User | null;
  stats: Stats | null;
  goals: Goal[];
  expenses: Expense[];
}

function readSentLog(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(CRON_SENT_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeSentLog(log: Record<string, number>) {
  localStorage.setItem(CRON_SENT_KEY, JSON.stringify(log));
}

export function touchLastActive() {
  localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
}

export function touchLastExpense() {
  const now = Date.now();
  localStorage.setItem(LAST_EXPENSE_KEY, String(now));
  touchLastActive();
}

export function touchLastSaving() {
  const now = Date.now();
  localStorage.setItem(LAST_SAVING_KEY, String(now));
  touchLastActive();
}

export function syncActivityFromData(expenses: Expense[]) {
  if (expenses.length === 0) return;
  const latest = expenses.reduce((max, e) => {
    const t = new Date(e.createdAt || e.date).getTime();
    return t > max ? t : max;
  }, 0);
  if (latest > 0) {
    const stored = Number(localStorage.getItem(LAST_EXPENSE_KEY) || 0);
    if (latest > stored) localStorage.setItem(LAST_EXPENSE_KEY, String(latest));
  }
}

function daysSince(timestamp: number | null): number {
  if (!timestamp) return Infinity;
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function inHourWindow(hour: number, windowMinutes = 5): boolean {
  const now = new Date();
  return now.getHours() === hour && now.getMinutes() < windowMinutes;
}

function canSend(messageId: string, cooldownHours: number): boolean {
  const log = readSentLog();
  const lastSent = log[messageId];
  if (!lastSent) return true;
  return Date.now() - lastSent >= cooldownHours * 60 * 60 * 1000;
}

function markSent(messageId: string) {
  const log = readSentLog();
  log[messageId] = Date.now();
  writeSentLog(log);
}

function personalize(text: string, user: User | null): string {
  const name = user?.name?.trim() || 'Dreamer';
  return text.replace(/\{name\}/g, name);
}

function pickMotivationalToday(): CronMessage | null {
  const today = new Date().toDateString();
  const storedDay = localStorage.getItem(MOTIVATIONAL_DAY_KEY);
  const pool = CRON_MESSAGES.filter(m => m.condition === 'motivational');
  if (pool.length === 0) return null;

  if (storedDay === today) {
    const sent = readSentLog();
    const sentToday = pool.find(m => sent[m.id] && isToday(sent[m.id]));
    if (sentToday) return null;
  }

  localStorage.setItem(MOTIVATIONAL_DAY_KEY, today);
  const dayIndex = new Date().getDate() % pool.length;
  return pool[dayIndex];
}

function matchesCondition(message: CronMessage, ctx: CronContext): boolean {
  const lastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY) || Date.now());
  const lastExpense = Number(localStorage.getItem(LAST_EXPENSE_KEY) || 0) || null;
  const lastSaving = Number(localStorage.getItem(LAST_SAVING_KEY) || 0) || null;
  const inactiveDays = daysSince(lastActive);
  const { stats, expenses } = ctx;
  const now = new Date();

  switch (message.condition) {
    case 'scheduled':
      return message.hour !== undefined && inHourWindow(message.hour);

    case 'inactive':
      return inactiveDays >= (message.inactiveMinDays ?? 0)
        && inactiveDays < (message.inactiveMaxDays ?? Infinity);

    case 'no_expense_inactive': {
      const expenseInactive = daysSince(lastExpense);
      return expenseInactive >= (message.inactiveMinDays ?? 0)
        && expenseInactive < (message.inactiveMaxDays ?? Infinity);
    }

    case 'no_savings_inactive': {
      const savingInactive = daysSince(lastSaving);
      return savingInactive >= (message.inactiveMinDays ?? 0)
        && savingInactive < (message.inactiveMaxDays ?? Infinity);
    }

    case 'budget_warning':
      if (!stats || stats.monthlyBudget <= 0) return false;
      return stats.budgetUsedPercent >= (message.budgetThreshold ?? 100);

    case 'no_budget':
      return !stats || stats.monthlyBudget <= 0;

    case 'no_expense_today': {
      if (message.hour !== undefined && !inHourWindow(message.hour)) return false;
      const loggedToday = expenses.some(e => isToday(new Date(e.createdAt || e.date).getTime()));
      return !loggedToday;
    }

    case 'quests_incomplete': {
      if (message.hour !== undefined && !inHourWindow(message.hour)) return false;
      if (!stats) return false;
      return stats.questsCompleted < 3;
    }

    case 'low_sunshine':
      return !!stats && stats.sunshineScore < 15 && stats.monthlyExpenses > 0;

    case 'streak_active': {
      if (message.hour !== undefined && !inHourWindow(message.hour)) return false;
      return !!stats && stats.savingStreak >= 3;
    }

    case 'weekly':
      if (message.dayOfWeek !== undefined && now.getDay() !== message.dayOfWeek) return false;
      return message.hour !== undefined && inHourWindow(message.hour);

    case 'monthly_start':
      if (now.getDate() !== 1) return false;
      return message.hour !== undefined && inHourWindow(message.hour);

    case 'monthly_mid':
      if (now.getDate() !== 15) return false;
      return message.hour !== undefined && inHourWindow(message.hour);

    case 'motivational':
      return message.hour !== undefined && inHourWindow(message.hour);

    default:
      return false;
  }
}

function dispatch(message: CronMessage, ctx: CronContext) {
  sendNotification(personalize(message.title, ctx.user), {
    body: personalize(message.body, ctx.user),
    tag: message.id,
  });
  markSent(message.id);
}

/** Max one notification per tick to avoid spam */
const MAX_PER_TICK = 1;

export function runCronNotifications(ctx: CronContext): number {
  if (!areNotificationsEnabled()) return 0;

  let sent = 0;

  // Pick one motivational message for today
  const motivational = pickMotivationalToday();
  const candidates = motivational
    ? [...CRON_MESSAGES.filter(m => m.condition !== 'motivational'), motivational]
    : CRON_MESSAGES.filter(m => m.condition !== 'motivational');

  // Budget / activity alerts — fire on app open, not time-locked
  for (const message of candidates.filter(m =>
    ['budget_warning', 'no_budget', 'low_sunshine'].includes(m.condition)
  )) {
    if (sent >= MAX_PER_TICK) break;
    if (!canSend(message.id, message.cooldownHours)) continue;
    if (!matchesCondition(message, ctx)) continue;
    dispatch(message, ctx);
    sent++;
  }

  // Time-scheduled messages
  for (const message of candidates.filter(m =>
    !['inactive', 'no_expense_inactive', 'no_savings_inactive', 'budget_warning', 'no_budget', 'low_sunshine', 'motivational'].includes(m.condition)
  )) {
    if (sent >= MAX_PER_TICK) break;
    if (!canSend(message.id, message.cooldownHours)) continue;
    if (!matchesCondition(message, ctx)) continue;
    dispatch(message, ctx);
    sent++;
  }

  // Inactive — fire when user returns to the app
  for (const message of candidates.filter(m =>
    ['inactive', 'no_expense_inactive', 'no_savings_inactive'].includes(m.condition)
  )) {
    if (sent >= MAX_PER_TICK) break;
    if (!canSend(message.id, message.cooldownHours)) continue;
    if (!matchesCondition(message, ctx)) continue;
    dispatch(message, ctx);
    sent++;
  }

  // One motivational per day
  if (sent < MAX_PER_TICK && motivational && canSend(motivational.id, motivational.cooldownHours)) {
    if (matchesCondition(motivational, ctx)) {
      dispatch(motivational, ctx);
      sent++;
    }
  }

  return sent;
}
