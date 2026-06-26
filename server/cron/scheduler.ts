import webpush from 'web-push';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { getVapidPublicKey, requireEnv } from '../env.js';
import {
  calculateSpendingIntensity,
  calculateSunshineScore,
  selectMessagesForUser,
  type UserNotificationContext,
} from './evaluator.js';

let vapidConfigured = false;

export function configureWebPush() {
  const publicKey = getVapidPublicKey();
  const privateKey = requireEnv('VAPID_PRIVATE_KEY');
  if (!publicKey) throw new Error('Missing VAPID public key (VITE_VAPID_PUBLIC_KEY or VAPID_PUBLIC_KEY)');
  webpush.setVapidDetails('mailto:support@pinkcloud.app', publicKey, privateKey);
  vapidConfigured = true;
}

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

async function buildUserContext(userId: string): Promise<UserNotificationContext | null> {
  const mk = monthKey();

  const [{ data: userRow }, { data: activity }, { data: expenses }, { data: savings }, { data: quests }] = await Promise.all([
    supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle(),
    supabaseAdmin.from('user_activity').select('*').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('expenses').select('amount, created_at').eq('user_id', userId),
    supabaseAdmin.from('savings').select('amount, created_at').eq('user_id', userId),
    supabaseAdmin.from('quest_progress').select('quest_id, completed').eq('user_id', userId),
  ]);

  if (!userRow) return null;

  const monthlyExpenses = (expenses || [])
    .filter(e => e.created_at?.slice(0, 7) === mk)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const monthlySavings = (savings || [])
    .filter(s => s.created_at?.slice(0, 7) === mk)
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const monthlyBudget = Number(userRow.monthly_budget || 0);
  const savingStreak = Number(userRow.saving_streak || 0);
  const spendingIntensity = calculateSpendingIntensity(monthlyExpenses, monthlyBudget);
  const sunshineScore = calculateSunshineScore(spendingIntensity, savingStreak);

  const expenseLoggedToday = (expenses || []).some(e => isToday(e.created_at));
  const questsCompleted = (quests || []).filter(q => q.completed).length;

  return {
    userId,
    name: userRow.name || 'Dreamer',
    monthlyBudget,
    monthlyExpenses,
    monthlySavings,
    budgetUsedPercent: spendingIntensity,
    sunshineScore,
    savingStreak,
    questsCompleted,
    lastActiveAt: activity?.last_active_at ? new Date(activity.last_active_at) : null,
    lastExpenseAt: activity?.last_expense_at ? new Date(activity.last_expense_at) : null,
    lastSavingAt: activity?.last_saving_at ? new Date(activity.last_saving_at) : null,
    expenseLoggedToday,
  };
}

async function sendPushToUser(
  userId: string,
  payload: { id: string; title: string; body: string },
) {
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (!subs?.length) return 0;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    tag: payload.id,
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushPayload,
      );
      sent++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
      console.warn(`Push failed for ${userId}:`, status ?? err);
    }
  }

  if (sent > 0) {
    await supabaseAdmin.from('notification_sent_log').upsert(
      { user_id: userId, message_id: payload.id, sent_at: new Date().toISOString() },
      { onConflict: 'user_id,message_id' },
    );
  }

  return sent;
}

export async function runNotificationCron(): Promise<{ users: number; sent: number }> {
  if (!vapidConfigured) configureWebPush();

  const { data: subscriptions } = await supabaseAdmin
    .from('push_subscriptions')
    .select('user_id');

  const userIds = [...new Set((subscriptions || []).map(s => s.user_id))];
  let totalSent = 0;

  for (const userId of userIds) {
    const { data: activity } = await supabaseAdmin
      .from('user_activity')
      .select('notifications_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    if (activity?.notifications_enabled === false) continue;

    const ctx = await buildUserContext(userId);
    if (!ctx) continue;

    const { data: sentRows } = await supabaseAdmin
      .from('notification_sent_log')
      .select('message_id, sent_at')
      .eq('user_id', userId);

    const sentLog = new Map<string, Date>();
    const sentTodayIds = new Set<string>();
    const today = new Date().toDateString();

    for (const row of sentRows || []) {
      const sentAt = new Date(row.sent_at);
      sentLog.set(row.message_id, sentAt);
      if (sentAt.toDateString() === today) sentTodayIds.add(row.message_id);
    }

    const messages = selectMessagesForUser(ctx, sentLog, sentTodayIds);
    for (const msg of messages) {
      totalSent += await sendPushToUser(userId, msg);
    }
  }

  return { users: userIds.length, sent: totalSent };
}

export async function sendTestPush(userId: string, title: string, body: string) {
  if (!vapidConfigured) configureWebPush();
  return sendPushToUser(userId, { id: 'test', title, body });
}
