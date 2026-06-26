import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.43.0";
import webpush from "npm:web-push@3.6.7";
import {
  calculateSpendingIntensity,
  calculateSunshineScore,
  selectMessagesForUser,
  type UserNotificationContext,
} from './evaluator.ts';

let vapidConfigured = false;

function configureWebPush() {
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!publicKey || !privateKey) {
    console.warn('Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY');
    return false;
  }
  webpush.setVapidDetails('mailto:support@pinkcloud.app', publicKey, privateKey);
  vapidConfigured = true;
  return true;
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

async function buildUserContext(supabaseAdmin: any, userId: string): Promise<UserNotificationContext | null> {
  const mk = monthKey();

  const [
    { data: userRow },
    { data: activity },
    { data: expenses },
    { data: savings },
    { data: quests }
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle(),
    supabaseAdmin.from('user_activity').select('*').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('expenses').select('amount, created_at').eq('user_id', userId),
    supabaseAdmin.from('savings').select('amount, created_at').eq('user_id', userId),
    supabaseAdmin.from('quest_progress').select('quest_id, completed').eq('user_id', userId),
  ]);

  if (!userRow) return null;

  const monthlyExpenses = (expenses || [])
    .filter((e: any) => e.created_at?.slice(0, 7) === mk)
    .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

  const monthlySavings = (savings || [])
    .filter((s: any) => s.created_at?.slice(0, 7) === mk)
    .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);

  const monthlyBudget = Number(userRow.monthly_budget || 0);
  const savingStreak = Number(userRow.saving_streak || 0);
  const spendingIntensity = calculateSpendingIntensity(monthlyExpenses, monthlyBudget);
  const sunshineScore = calculateSunshineScore(spendingIntensity, savingStreak);

  const expenseLoggedToday = (expenses || []).some((e: any) => isToday(e.created_at));
  const questsCompleted = (quests || []).filter((q: any) => q.completed).length;

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
  supabaseAdmin: any,
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
    } catch (err: any) {
      const status = err.statusCode;
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

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Authorize using Authorization header to prevent abuse if called externally
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!vapidConfigured) {
    configureWebPush();
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id');

    const userIds = [...new Set((subscriptions || []).map((s: any) => s.user_id))] as string[];
    let totalSent = 0;

    for (const userId of userIds) {
      const { data: activity } = await supabaseAdmin
        .from('user_activity')
        .select('notifications_enabled')
        .eq('user_id', userId)
        .maybeSingle();

      if (activity?.notifications_enabled === false) continue;

      const ctx = await buildUserContext(supabaseAdmin, userId);
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
        totalSent += await sendPushToUser(supabaseAdmin, userId, msg);
      }
    }

    return new Response(JSON.stringify({ success: true, users: userIds.length, sent: totalSent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error running cron:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
