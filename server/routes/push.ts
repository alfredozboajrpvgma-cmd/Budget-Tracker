import { Router } from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { getVapidPublicKey } from '../env.js';
import type { AuthedRequest } from '../middleware/supabaseAuth.js';
import { supabaseAuth } from '../middleware/supabaseAuth.js';
import { sendTestPush } from '../cron/scheduler.js';

import { strictLimiter, activityLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/vapid-public-key', (_req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    res.status(503).json({ error: 'VAPID public key not configured' });
    return;
  }
  res.json({ publicKey: key });
});

router.post('/subscribe', strictLimiter, supabaseAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const { subscription } = req.body as {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  };

  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    res.status(400).json({ error: 'Invalid push subscription' });
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from('push_subscriptions')
    .select('user_id')
    .eq('endpoint', subscription.endpoint)
    .maybeSingle();

  if (existing && existing.user_id !== userId) {
    res.status(409).json({ error: 'Push endpoint already registered to another account' });
    return;
  }

  const { error } = await supabaseAdmin.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: 'endpoint' },
  );

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  await supabaseAdmin.from('user_activity').upsert(
    {
      user_id: userId,
      last_active_at: new Date().toISOString(),
      notifications_enabled: true,
    },
    { onConflict: 'user_id' },
  );

  res.json({ ok: true });
});

router.delete('/subscribe', strictLimiter, supabaseAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const endpoint = req.body?.endpoint as string | undefined;

  if (endpoint) {
    await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', userId);
  } else {
    await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId);
  }

  res.json({ ok: true });
});

router.post('/activity', activityLimiter, supabaseAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const type = (req.body?.type as string) || 'active';
  const now = new Date().toISOString();

  const patch: Record<string, string | boolean> = {
    user_id: userId,
    last_active_at: now,
  };

  if (type === 'expense') patch.last_expense_at = now;
  if (type === 'saving') patch.last_saving_at = now;
  if (typeof req.body?.notificationsEnabled === 'boolean') {
    patch.notifications_enabled = req.body.notificationsEnabled;
  }

  await supabaseAdmin.from('user_activity').upsert(patch, { onConflict: 'user_id' });
  res.json({ ok: true });
});

router.post('/test', strictLimiter, supabaseAuth, async (req: AuthedRequest, res) => {
  const body = typeof req.body?.body === 'string' ? req.body.body.slice(0, 160) : undefined;
  const count = await sendTestPush(
    req.userId!,
    'PinkCloud Test 🔔',
    body || 'Server push is working — even with the tab closed!',
  );
  res.json({ ok: true, sent: count });
});

export default router;
