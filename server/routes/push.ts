import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { getVapidPublicKey } from '../env.js';
import type { AuthedRequest } from '../middleware/supabaseAuth.js';
import { supabaseAuth } from '../middleware/supabaseAuth.js';
import { sendTestPush } from '../cron/scheduler.js';

import { strictLimiter, activityLimiter } from '../middleware/rateLimit.js';

const router = Router();

const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

const activitySchema = z.object({
  type: z.enum(['active', 'expense', 'saving']).optional().default('active'),
  notificationsEnabled: z.boolean().optional(),
});

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
  
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid push subscription payload' });
    return;
  }
  
  const { subscription } = parsed.data;

  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id')
      .eq('endpoint', subscription.endpoint)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing && existing.user_id !== userId) {
      res.status(409).json({ error: 'Push endpoint already registered to another account' });
      return;
    }

    const { error: upsertError } = await supabaseAdmin.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' },
    );

    if (upsertError) throw upsertError;

    await supabaseAdmin.from('user_activity').upsert(
      {
        user_id: userId,
        last_active_at: new Date().toISOString(),
        notifications_enabled: true,
      },
      { onConflict: 'user_id' },
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe to push notifications. Please try again.' });
  }
});

router.delete('/subscribe', strictLimiter, supabaseAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : undefined;

  try {
    if (endpoint) {
      await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', userId);
    } else {
      await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

router.post('/activity', activityLimiter, supabaseAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  
  const parsed = activitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid activity payload' });
    return;
  }
  
  const { type, notificationsEnabled } = parsed.data;
  const now = new Date().toISOString();

  const patch: Record<string, string | boolean> = {
    user_id: userId,
    last_active_at: now,
  };

  if (type === 'expense') patch.last_expense_at = now;
  if (type === 'saving') patch.last_saving_at = now;
  if (notificationsEnabled !== undefined) {
    patch.notifications_enabled = notificationsEnabled;
  }

  try {
    await supabaseAdmin.from('user_activity').upsert(patch, { onConflict: 'user_id' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Activity log error:', err);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

router.post('/test', strictLimiter, supabaseAuth, async (req: AuthedRequest, res) => {
  const body = typeof req.body?.body === 'string' ? req.body.body.slice(0, 160) : undefined;
  
  try {
    const count = await sendTestPush(
      req.userId!,
      'PinkCloud Test 🔔',
      body || 'Server push is working — even with the tab closed!',
    );
    res.json({ ok: true, sent: count });
  } catch (err) {
    console.error('Test push error:', err);
    res.status(500).json({ error: 'Failed to send test push' });
  }
});

export default router;
