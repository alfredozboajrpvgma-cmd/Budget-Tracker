import { Router } from 'express';
import { randomUUID } from 'crypto';
import {
  createUser,
  createSession,
  getUserByEmail,
  getUserByToken,
  deleteSession,
  updateUser,
  createGoal,
} from '../db.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

function formatUser(user: ReturnType<typeof getUserByToken>) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarSeed: user.avatar_seed,
    xp: user.xp,
    level: user.level,
    levelTitle: user.level_title,
    monthlyBudget: user.monthly_budget,
    onboardingComplete: !!user.onboarding_complete,
    savingStreak: user.saving_streak,
  };
}

function xpForLevel(_level: number): number {
  return 1000;
}

function checkLevelUp(userId: string, currentXp: number, currentLevel: number) {
  const needed = xpForLevel(currentLevel);
  if (currentXp >= needed && currentLevel < 10) {
    const titles = ['Cloud Builder', 'Dream Chaser', 'Sky Wanderer', 'Star Saver', 'Cloud Master'];
    const newLevel = currentLevel + 1;
    updateUser(userId, {
      level: newLevel,
      level_title: titles[Math.min(newLevel - 1, titles.length - 1)] ?? 'Cloud Legend',
    });
    return { leveledUp: true, newLevel };
  }
  return { leveledUp: false };
}

router.post('/login', (req, res) => {
  const { provider, email, name } = req.body as { provider?: string; email?: string; name?: string };

  let user;
  if (email) {
    user = getUserByEmail(email);
    if (!user) {
      user = createUser({ email, name: name ?? '' });
    }
  } else {
    const guestEmail = `${provider ?? 'guest'}_${randomUUID().slice(0, 8)}@pinkcloud.app`;
    user = createUser({ email: guestEmail, name: name ?? '' });
  }

  const token = createSession(user.id);
  res.json({ token, user: formatUser(user) });
});

router.post('/register', (req, res) => {
  const { email, name } = req.body as { email?: string; name?: string };
  if (!email) {
    res.status(400).json({ error: 'Email required' });
    return;
  }
  if (getUserByEmail(email)) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const user = createUser({ email, name: name ?? '' });
  const token = createSession(user.id);
  res.json({ token, user: formatUser(user) });
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  const user = getUserByToken(req.headers.authorization!.slice(7));
  res.json({ user: formatUser(user) });
});

router.post('/logout', requireAuth, (req: AuthRequest, res) => {
  deleteSession(req.headers.authorization!.slice(7));
  res.json({ ok: true });
});

router.patch('/onboarding', requireAuth, (req: AuthRequest, res) => {
  const { name, avatarSeed, dreamTitle, dreamType, dreamTarget } = req.body as {
    name?: string;
    avatarSeed?: string;
    dreamTitle?: string;
    dreamType?: string;
    dreamTarget?: number;
  };

  const userId = req.userId!;
  updateUser(userId, {
    name: name ?? undefined,
    avatar_seed: avatarSeed ?? undefined,
    onboarding_complete: 1,
  });

  if (dreamTitle?.trim()) {
    createGoal(userId, {
      title: dreamTitle.trim(),
      type: dreamType ?? 'Other',
      targetAmount: dreamTarget ?? 10000,
    });
    updateUser(userId, { xp: (getUserByToken(req.headers.authorization!.slice(7))?.xp ?? 0) + 25 });
  }

  const user = getUserByToken(req.headers.authorization!.slice(7));
  res.json({ user: formatUser(user) });
});

router.patch('/profile', requireAuth, (req: AuthRequest, res) => {
  const { name, avatarSeed, monthlyBudget } = req.body as {
    name?: string;
    avatarSeed?: string;
    monthlyBudget?: number;
  };

  const fields: Parameters<typeof updateUser>[1] = {};
  if (name !== undefined) fields.name = name;
  if (avatarSeed !== undefined) fields.avatar_seed = avatarSeed;
  if (monthlyBudget !== undefined) {
    const budget = Number(monthlyBudget);
    if (!Number.isFinite(budget) || budget <= 0) {
      res.status(400).json({ error: 'Monthly budget must be a positive number' });
      return;
    }
    fields.monthly_budget = budget;
  }

  if (Object.keys(fields).length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  updateUser(req.userId!, fields);
  const user = getUserByToken(req.headers.authorization!.slice(7));
  res.json({ user: formatUser(user) });
});

export { checkLevelUp, xpForLevel, formatUser };
export default router;
