import { supabase } from './supabaseClient';
import type { User, Goal, Expense, Stats } from '../types';
import { xpForLevel, xpProgressPercent } from '../utils/xp';
import { toNumber } from '../utils/format';
import { normalizeGoalAmounts } from '../utils/goals';
import { buildVibeStats } from '../utils/vibe';
import { createRandomGenerator } from '../utils/prng';
import type { DynamicQuest } from '../types';

function formatAuthError(error: { message?: string; status?: number; code?: string; msg?: string }) {
  const msg = (error.message ?? error.msg ?? '').toLowerCase();

  if (
    msg.includes('error sending confirmation email') ||
    msg.includes('email rate limit') ||
    msg.includes('smtp') ||
    error.code === 'unexpected_failure'
  ) {
    return new Error('Unable to send confirmation email. Please try again later or contact support.');
  }

  if (error.status === 500 || msg.includes('database error saving new user')) {
    return new Error('Sign up failed due to a server error. Please try again later.');
  }

  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return new Error('This email is already registered. Try signing in instead.');
  }

  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return new Error('Invalid email or password.');
  }

  if (msg.includes('captcha')) {
    return new Error('Captcha verification failed. Please complete the challenge and try again.');
  }

  return new Error('Authentication failed. Please try again.');
}

function assertPassword(password: string) {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
}

function generateShareCode(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

export const api = {
  async login({ email, password, provider, mode = 'login', captchaToken }: { provider?: string; email?: string; password?: string; name?: string; mode?: 'login' | 'signup'; captchaToken?: string }) {
    if (provider === 'google' || provider === 'facebook') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
      return { token: '', user: null as any };
    } else if (provider === 'guest') {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      let { data: userRow } = await supabase.from('users').select('*').eq('id', data.user?.id).maybeSingle();
      if (!userRow) {
        const { data: newRow } = await supabase.from('users').insert({ id: data.user?.id, email: data.user?.email }).select().single();
        userRow = newRow;
      }
      return { token: data.session?.access_token || '', user: mapUser(userRow) };
    } else if (email && password) {
      const authOptions = captchaToken ? { captchaToken } : undefined;

      if (mode === 'signup') {
        assertPassword(password);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: authOptions,
        });

        if (error) {
          throw formatAuthError(error);
        }
        
        if (!data.session) {
          return { token: '', user: null as any, needsConfirmation: true, email };
        }
        
        return await this._finalizeLogin(data);
      } else {
        const signInRes = await supabase.auth.signInWithPassword({
          email,
          password,
          options: authOptions,
        });
        if (signInRes.error) {
          if (signInRes.error.message.includes('Email not confirmed')) {
            return { token: '', user: null as any, needsConfirmation: true, email };
          }
          throw formatAuthError(signInRes.error);
        }
        return await this._finalizeLogin(signInRes.data);
      }
    }
    throw new Error('Not implemented');
  },

  async _finalizeLogin(data: any) {
    let { data: userRow } = await supabase.from('users').select('*').eq('id', data.user?.id).maybeSingle();
    if (!userRow) {
      const { data: newRow } = await supabase.from('users').insert({ id: data.user?.id, email: data.user?.email }).select().single();
      userRow = newRow;
    }
    return { token: data.session?.access_token || '', user: { ...mapUser(userRow), email: data.user?.email ?? userRow.email }, needsConfirmation: false, email: data.user?.email };
  },

  async verifyEmailCode({ email, code }: { email: string; code: string }) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    if (error) throw formatAuthError(error);
    if (!data.session) throw new Error('Verification failed. Try again.');
    return await this._finalizeLogin(data);
  },

  async resendConfirmationCode({ email }: { email: string }) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw formatAuthError(error);
  },

  async register({ email, name }: { email: string; name?: string }) {
    return this.login({ email, name });
  },

  async getMe() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');
    let { data: userRow } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    if (!userRow) {
      const { data: newRow } = await supabase.from('users').insert({ id: user.id, email: user.email }).select().single();
      userRow = newRow;
    }
    return { user: { ...mapUser(userRow), email: user.email ?? userRow.email } };
  },

  async logout() {
    await supabase.auth.signOut();
    return { ok: true };
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase.rpc('get_public_profile', { p_user_id: userId });
    if (error) {
      const { data: fallback, error: fallbackError } = await supabase
        .from('users')
        .select('id, name, avatar_seed, level, level_title, created_at')
        .eq('id', userId)
        .single();
      if (fallbackError) throw fallbackError;
      return {
        id: fallback.id,
        name: fallback.name,
        avatarSeed: fallback.avatar_seed,
        level: fallback.level,
        levelTitle: fallback.level_title,
        createdAt: fallback.created_at,
      };
    }
    return {
      id: data.id,
      name: data.name,
      avatarSeed: data.avatar_seed,
      level: data.level,
      levelTitle: data.level_title,
      createdAt: data.created_at,
    };
  },

  async completeOnboarding({ name, avatarSeed, dreamTitle, dreamType, dreamTarget }: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');
    
    // First try to update
    let { data: userRow, error } = await supabase.from('users').update({
      name,
      avatar_seed: avatarSeed,
      onboarding_complete: true
    }).eq('id', user.id).select().maybeSingle();

    // If row doesn't exist (e.g. created before SQL trigger), insert it
    if (!userRow) {
      const { data: newRow, error: insertError } = await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        name,
        avatar_seed: avatarSeed,
        onboarding_complete: true
      }).select().single();
      if (insertError) throw insertError;
      userRow = newRow;
    } else if (error) {
      throw error;
    }

    if (dreamTitle && dreamTarget) {
      const { error: goalError } = await supabase.from('goals').insert({
        user_id: user.id,
        title: dreamTitle,
        type: dreamType || 'Other',
        target_amount: dreamTarget
      });
      if (goalError) throw goalError;
    }

    return { user: mapUser(userRow) };
  },

  async updateProfile(body: { name?: string; avatarSeed?: string; monthlyBudget?: number }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');
    
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.avatarSeed !== undefined) updates.avatar_seed = body.avatarSeed;
    if (body.monthlyBudget !== undefined) updates.monthly_budget = body.monthlyBudget;

    const { data: userRow, error } = await supabase.from('users').update(updates).eq('id', user.id).select().single();
    if (error) throw error;
    return { user: mapUser(userRow) };
  },

  async getGoals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { goals: [] };

    // Fetch own goals
    const { data: ownGoals, error: e1 } = await supabase.from('goals').select('*, users(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (e1) throw e1;

    // Fetch shared goals (where user is in the shared_with JSONB array)
    // Use .filter() with JSON format for JSONB containment (not .contains which sends PG array format)
    let sharedGoals: any[] = [];
    try {
      const { data: sg, error: e2 } = await supabase.from('goals').select('*, users(name)')
        .filter('shared_with', 'cs', JSON.stringify([user.id]))
        .order('created_at', { ascending: false });
      if (e2) console.error('[getGoals] shared goals error:', e2);
      if (!e2) sharedGoals = sg || [];
    } catch (err) {
      console.error('[getGoals] shared goals exception:', err);
    }

    // Merge and deduplicate
    const seen = new Set<string>();
    const allGoals = [...(ownGoals || []), ...(sharedGoals || [])].filter(g => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });

    return { goals: allGoals.map(mapGoal) };
  },

  async createGoal({ title, type, targetAmount, currencySymbol }: { title: string; type: string; targetAmount: number; currencySymbol: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');

    // Generate a 6-character random alphanumeric share code
    const shareCode = generateShareCode();

    const { data, error } = await supabase.from('goals').insert({
      user_id: user.id,
      title,
      type,
      target_amount: toNumber(targetAmount),
      share_code: shareCode,
      shared_with: [],
      currency_symbol: currencySymbol
    }).select().single();
    if (error) throw error;
    
    return { goal: mapGoal(data), xpGained: 0 };
  },

  async joinGoal(shareCode: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');

    const code = shareCode.toUpperCase().trim();

    const { data, error } = await supabase.rpc('join_goal_by_code', {
      p_share_code: code
    });

    if (error) {
      // Extract the actual error message from PostgreSQL exception
      const msg = error.message || 'Failed to join dream';
      throw new Error(msg);
    }

    return { goal: mapGoal(data), xpGained: 20 };
  },

  async contributeToGoal(goalId: string, amount: number) {
    const safeAmount = toNumber(amount);
    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      throw new Error('Amount must be greater than zero.');
    }

    const { data, error } = await supabase.rpc('contribute_to_goal', {
      p_goal_id: goalId,
      p_amount: safeAmount,
    });
    if (error) throw new Error(error.message || 'Failed to save amount');

    const { data: { user } } = await supabase.auth.getUser();
    let xpGained = 0;
    let levelResult = { leveledUp: false, newLevel: 0 };
    if (user) {
      xpGained = Math.min(50, Math.round(safeAmount / 10));
      if (xpGained > 0) levelResult = await addXpToUser(user.id, xpGained);
    }

    return { goal: mapGoal(data), xpGained, streak: 1, ...levelResult };
  },

  async deleteGoal(goalId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');

    const { error } = await supabase.from('goals').delete().eq('id', goalId).eq('user_id', user.id);
    if (error) throw error;
    return { ok: true };
  },

  async getExpenses() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { expenses: [] };

    const { data, error } = await supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return { expenses: (data || []).map(mapExpense) };
  },

  async createExpense({ amount, category, note }: { amount: number; category: string; note: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');

    const { data, error } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount: toNumber(amount),
      category,
      note
    }).select().single();
    if (error) throw error;

    // Deduct XP for spending: 1 XP lost per ₱50 spent
    const xpLost = Math.max(1, Math.floor(toNumber(amount) / 50));
    await deductXpFromUser(user.id, xpLost);
    
    return { expense: mapExpense(data), xpGained: -xpLost, leveledUp: false, newLevel: 0 };
  },

  async deleteExpense(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');

    const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    return { ok: true };
  },

  async getStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');

    const { data: userRow } = await supabase.from('users').select('*').eq('id', user.id).single();
    const { data: expenses } = await supabase.from('expenses').select('*').eq('user_id', user.id);
    const { data: savings } = await supabase.from('savings').select('*').eq('user_id', user.id);

    const monthKey = new Date().toISOString().slice(0, 7);
    const isCurrentMonth = (dateStr: string) => dateStr.slice(0, 7) === monthKey;
    const monthlyExpenseRows = (expenses || []).filter(e => isCurrentMonth(e.created_at));
    const monthlySavingRows = (savings || []).filter(s => isCurrentMonth(s.created_at));

    const monthlyBudget = toNumber(userRow?.monthly_budget);
    const savingStreak = userRow?.saving_streak || 0;
    const monthlyExpenses = monthlyExpenseRows.reduce((sum, e) => sum + toNumber(e.amount), 0);
    const monthlySavings = monthlySavingRows.reduce((sum, s) => sum + toNumber(s.amount), 0);
    const totalBalance = Math.max(0, monthlyBudget - monthlyExpenses);

    const categories: Record<string, number> = {};
    monthlyExpenseRows.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + toNumber(e.amount);
    });
    const maxCategoryTotal = Math.max(...Object.values(categories), 1);
    const categoryBreakdown = Object.entries(categories).map(([category, total]) => ({
      category,
      total,
      percent: Math.round((total / maxCategoryTotal) * 100)
    })).sort((a, b) => b.total - a.total);

    const { spendingIntensity, sunshineScore, rainLabel } = buildVibeStats(
      monthlyExpenses,
      monthlyBudget,
      savingStreak,
    );

    const isToday = (dateStr: string) => {
      const d = new Date(dateStr);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    };

    const todaySavingRows = (savings || []).filter(s => isToday(s.created_at));
    const todaySavings = todaySavingRows.reduce((sum, s) => sum + toNumber(s.amount), 0);


    const prng = createRandomGenerator(`${user.id}-${new Date().toDateString()}`);
    const numQuests = Math.floor(prng() * 7) + 4; // 4 to 10 quests
    const generatedQuests: DynamicQuest[] = [];
    
    // Available save targets to pick from
    const saveTargets = [10, 20, 50, 100, 150, 200, 250, 300, 400, 500];
    
    for (let i = 0; i < numQuests; i++) {
      const targetIndex = Math.floor(prng() * saveTargets.length);
      const target = saveTargets[targetIndex];
      const progress = Math.min(todaySavings, target);
      const completed = todaySavings >= target;
      // XP reward scales slightly with difficulty, e.g., base 10 + target / 5
      const xpReward = Math.min(100, 10 + Math.floor(target / 5));

      generatedQuests.push({
        id: `save-${target}-${i}`,
        type: 'save',
        title: `Save ${target} today`,
        progress,
        target,
        completed,
        xpReward
      });
    }

    const questsCompleted = generatedQuests.filter(q => q.completed).length;

    const stats: Stats = {
      totalBalance,
      monthlyBudget,
      monthlyExpenses,
      monthlySavings,
      todaySavings,
      budgetUsedPercent: spendingIntensity,
      savingsProgressPercent: monthlyBudget > 0
        ? Math.min(100, Math.round((monthlySavings / (monthlyBudget * 0.2)) * 100))
        : 0,
      totalSaved: monthlySavings,
      dreamProgressPercent: 0,
      xp: userRow?.xp || 0,
      xpNeeded: xpForLevel(userRow?.level || 1),
      xpProgressPercent: xpProgressPercent(userRow?.xp || 0, userRow?.level || 1),
      level: userRow?.level || 1,
      levelTitle: userRow?.level_title || 'Cloud Builder',
      savingStreak,
      sunshineScore,
      spendingIntensity,
      rainLabel,
      categoryBreakdown,
      quests: generatedQuests,
      questsCompleted
    };

    return stats;
  }
};

const LEVEL_TITLES = ['Cloud Builder', 'Dream Chaser', 'Sky Wanderer', 'Star Saver', 'Cloud Master', 'Cloud Legend'];

async function addXpToUser(userId: string, xpToAdd: number): Promise<{ leveledUp: boolean; newLevel: number }> {
  const { data: userRow } = await supabase.from('users').select('xp, level').eq('id', userId).single();
  if (!userRow) return { leveledUp: false, newLevel: 0 };

  const newXp = toNumber(userRow.xp) + xpToAdd;
  const currentLevel = toNumber(userRow.level) || 1;
  const xpNeeded = xpForLevel(currentLevel);

  if (newXp >= xpNeeded && currentLevel < 10) {
    const newLevel = currentLevel + 1;
    const newTitle = LEVEL_TITLES[Math.min(newLevel - 1, LEVEL_TITLES.length - 1)];
    await supabase.from('users').update({
      xp: newXp,
      level: newLevel,
      level_title: newTitle
    }).eq('id', userId);
    return { leveledUp: true, newLevel };
  }

  await supabase.from('users').update({ xp: newXp }).eq('id', userId);
  return { leveledUp: false, newLevel: 0 };
}

async function deductXpFromUser(userId: string, xpToRemove: number): Promise<void> {
  const { data: userRow } = await supabase.from('users').select('xp').eq('id', userId).single();
  if (!userRow) return;
  const newXp = Math.max(0, toNumber(userRow.xp) - xpToRemove);
  await supabase.from('users').update({ xp: newXp }).eq('id', userId);
}

function mapUser(row: any): User {
  if (!row) return {} as User;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarSeed: row.avatar_seed,
    xp: row.xp,
    level: row.level,
    levelTitle: row.level_title,
    monthlyBudget: toNumber(row.monthly_budget),
    onboardingComplete: row.onboarding_complete,
    savingStreak: row.saving_streak
  };
}

function mapGoal(row: any): Goal {
  const rawCurrent = toNumber(row.current_amount);
  const targetAmount = toNumber(row.target_amount);
  const { currentAmount, progress } = normalizeGoalAmounts(rawCurrent, targetAmount);
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    currentAmount,
    targetAmount,
    progress,
    shareCode: row.share_code,
    sharedWith: row.shared_with,
    createdAt: row.created_at,
    userId: row.user_id,
    ownerName: row.owner?.name || row.users?.name,
    currencySymbol: row.currency_symbol
  };
}

function mapExpense(row: any): Expense {
  return {
    id: row.id,
    amount: toNumber(row.amount),
    category: row.category,
    note: row.note,
    date: row.created_at,
    createdAt: row.created_at
  };
}

export function setAuthToken(token: string) {
  localStorage.setItem('pinkcloud_token', token);
}
export function clearAuthToken() {
  localStorage.removeItem('pinkcloud_token');
  localStorage.removeItem('pinkcloud_user');
}
