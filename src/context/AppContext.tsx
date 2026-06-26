import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { api, setAuthToken, clearAuthToken } from '../api/client';
import type { User, Goal, Expense, Stats } from '../types';
import { CURRENCIES } from './CurrencyContext';
import { sendNotification } from '../utils/notifications';
import { toNumber } from '../utils/format';
import { buildVibeStats } from '../utils/vibe';
import { touchLastExpense, touchLastSaving } from '../utils/cronNotifications';
import { useCronNotifications } from '../hooks/useCronNotifications';
import { useOfflineExpenseSync } from '../hooks/useOfflineExpenseSync';
import { isPushRegistered, pingActivity, registerPushSubscription } from '../utils/pushSubscription';
import {
  enqueuePendingExpense,
  getPendingExpensesForUser,
  pendingToExpense,
} from '../utils/offlineExpenses';
import { isNetworkError, isOffline } from '../utils/network';
import { clearCachedUser, getCachedUser, setCachedUser } from '../utils/userCache';
import { initIndexedDb } from '../utils/indexedDb';

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextValue {
  user: User | null;
  goals: Goal[];
  expenses: Expense[];
  stats: Stats | null;
  loading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  login: (opts?: { provider?: string; email?: string; password?: string; name?: string; mode?: 'login'|'signup'; captchaToken?: string }) => Promise<{ needsConfirmation?: boolean; email?: string } | void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: { name: string; avatarSeed: string; dreamTitle?: string; dreamType?: string; dreamTarget?: number }) => Promise<void>;
  refreshData: () => Promise<void>;
  addExpense: (data: { amount: number; category: string; note: string }) => Promise<void>;
  addGoal: (data: { title: string; type: string; targetAmount: number; currencySymbol: string }) => Promise<void>;
  joinGoal: (shareCode: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  updateMonthlyBudget: (amount: number) => Promise<void>;
  showToast: (message: string, severity?: ToastState['severity']) => void;
  savingsDialogOpen: boolean;
  setSavingsDialogOpen: (open: boolean) => void;
  savingsGoalId: string | null;
  setSavingsGoalId: (id: string | null) => void;
  selectedGoal: Goal | null;
  setSelectedGoal: (goal: Goal | null) => void;
  publicProfileId: string | null;
  setPublicProfileId: (id: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' });
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
  const [savingsGoalId, setSavingsGoalId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [publicProfileId, setPublicProfileId] = useState<string | null>(null);

  const showToast = useCallback((message: string, severity: ToastState['severity'] = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const getCurrencySymbol = () => {
    const code = localStorage.getItem('pinkcloud_currency');
    const found = CURRENCIES.find(c => c.code === code);
    return found?.symbol ?? '₱';
  };

  const fmtAmount = (amount: number) => `${getCurrencySymbol()}${toNumber(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  useCronNotifications({ user, stats, goals, expenses });

  useEffect(() => {
    if (!user) return;
    pingActivity('active');
    if (localStorage.getItem('pinkcloud_notifications_enabled') !== 'false' && isPushRegistered()) {
      registerPushSubscription().catch(console.warn);
    }
  }, [user?.id]);

  const refreshData = useCallback(async () => {
    const token = localStorage.getItem('pinkcloud_token');
    if (!token) return;
    try {
      const [meRes, goalsRes, expensesRes, statsRes] = await Promise.all([
        api.getMe(),
        api.getGoals(),
        api.getExpenses(),
        api.getStats(),
      ]);
      await setCachedUser(meRes.user);
      setUser(meRes.user);
      setGoals(goalsRes.goals);
      const pending = (await getPendingExpensesForUser(meRes.user.id)).map(pendingToExpense);
      setExpenses([...pending, ...expensesRes.expenses]);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      if (err instanceof Error && err.message === 'Not logged in') {
        clearAuthToken();
        await clearCachedUser();
        setUser(null);
        return;
      }

      const cachedUser = await getCachedUser();
      if (cachedUser && (isOffline() || isNetworkError(err))) {
        const pending = (await getPendingExpensesForUser(cachedUser.id)).map(pendingToExpense);
        setUser(cachedUser);
        setExpenses(prev => {
          const serverExpenses = prev.filter(exp => !exp.pending);
          return [...pending, ...serverExpenses];
        });
      }
    }
  }, []);

  useOfflineExpenseSync(user?.id, refreshData, showToast);

  useEffect(() => {
    void initIndexedDb();

    const token = localStorage.getItem('pinkcloud_token');
    if (token) {
      void (async () => {
        const cachedUser = await getCachedUser();
        if (cachedUser) setUser(cachedUser);
        await refreshData();
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, [refreshData]);

  const login = useCallback(async (opts?: { provider?: string; email?: string; password?: string; name?: string; mode?: 'login'|'signup'; captchaToken?: string }) => {
    const res = await api.login(opts ?? { provider: 'guest' });
    if (res.needsConfirmation) {
      return { needsConfirmation: true, email: res.email };
    }
    setAuthToken(res.token);
    localStorage.setItem('pinkcloud_user', 'true');
    setUser(res.user);
    await refreshData();
  }, [refreshData]);

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    const res = await api.verifyEmailCode({ email, code });
    setAuthToken(res.token);
    localStorage.setItem('pinkcloud_user', 'true');
    setUser(res.user);
    await refreshData();
  }, [refreshData]);

  const resendConfirmationCode = useCallback(async (email: string) => {
    await api.resendConfirmationCode({ email });
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* ignore */ }
    clearAuthToken();
    await clearCachedUser();
    setUser(null);
    setGoals([]);
    setExpenses([]);
    setStats(null);
  }, []);

  const completeOnboarding = useCallback(async (data: {
    name: string;
    avatarSeed: string;
    dreamTitle?: string;
    dreamType?: string;
    dreamTarget?: number;
  }) => {
    const res = await api.completeOnboarding(data);
    setUser(res.user);
    await refreshData();
    showToast(`Welcome to PinkCloud, ${data.name}! ☁️`);
  }, [refreshData, showToast]);

  const addExpense = useCallback(async (data: { amount: number; category: string; note: string }) => {
    if (!user) throw new Error('Not logged in');

    const expenseAmount = toNumber(data.amount);
    const queueOfflineExpense = async () => {
      const pending = await enqueuePendingExpense(user.id, data);
      setExpenses(prev => [pendingToExpense(pending), ...prev]);
      setStats(prev => {
        if (!prev) return prev;
        const monthlyExpenses = prev.monthlyExpenses + expenseAmount;
        const monthlyBudget = prev.monthlyBudget;
        const vibe = buildVibeStats(monthlyExpenses, monthlyBudget, prev.savingStreak);
        return {
          ...prev,
          monthlyExpenses,
          totalBalance: Math.max(0, monthlyBudget - monthlyExpenses),
          budgetUsedPercent: vibe.spendingIntensity,
          ...vibe,
        };
      });
      touchLastExpense();
      showToast(`${fmtAmount(data.amount)} saved offline — will sync when you're back online.`, 'info');
    };

    if (isOffline()) {
      await queueOfflineExpense();
      return;
    }

    try {
      const res = await api.createExpense(data);

      setStats(prev => {
        if (!prev) return prev;
        const monthlyExpenses = prev.monthlyExpenses + expenseAmount;
        const monthlyBudget = prev.monthlyBudget;
        const vibe = buildVibeStats(monthlyExpenses, monthlyBudget, prev.savingStreak);

        return {
          ...prev,
          monthlyExpenses,
          totalBalance: Math.max(0, monthlyBudget - monthlyExpenses),
          budgetUsedPercent: vibe.spendingIntensity,
          ...vibe,
        };
      });

      await refreshData();
      touchLastExpense();
      pingActivity('expense');
      let msg = `${fmtAmount(data.amount)} logged!`;
      if (res.xpGained !== 0) msg += ` ${res.xpGained > 0 ? '+' : ''}${res.xpGained} XP`;
      if (res.leveledUp) {
        msg += ` 🎉 Level ${res.newLevel}!`;
        sendNotification('Level Up! 🌟', { body: `Congratulations! You reached Level ${res.newLevel}!` });
      }
      showToast(msg, res.xpGained < 0 ? 'warning' : 'success');
    } catch (err) {
      if (isOffline() || isNetworkError(err)) {
        await queueOfflineExpense();
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to log expense';
      showToast(message, 'error');
      throw err;
    }
  }, [user, refreshData, showToast]);

  const addGoal = useCallback(async (data: { title: string; type: string; targetAmount: number; currencySymbol: string }) => {
    try {
      await api.createGoal(data);
      await refreshData();
      showToast(`"${data.title}" dream created! ☁️`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create dream';
      showToast(message, 'error');
      throw err;
    }
  }, [refreshData, showToast]);

  const joinGoal = useCallback(async (shareCode: string) => {
    const res = await api.joinGoal(shareCode);
    await refreshData();
    let msg = `Joined dream "${res.goal.title}"! +${res.xpGained} XP`;
    showToast(msg);
  }, [refreshData, showToast]);

  const contributeToGoal = useCallback(async (goalId: string, amount: number) => {
    try {
      const goal = goals.find(g => String(g.id) === String(goalId));
      const remaining = goal
        ? Math.max(0, goal.targetAmount - goal.currentAmount)
        : amount;
      const applied = Math.min(amount, remaining);

      if (applied <= 0) {
        showToast('This dream is already complete!', 'info');
        return;
      }

      const res = await api.contributeToGoal(goalId, applied);
      await refreshData();
      touchLastSaving();
      pingActivity('saving');
      let msg = `${fmtAmount(applied)} saved! +${res.xpGained} XP`;
      if (applied < amount) {
        msg = `${fmtAmount(applied)} applied to your dream (capped at target). +${res.xpGained} XP`;
      }
      if (res.leveledUp) {
        msg += ` 🎉 Level ${res.newLevel}!`;
        sendNotification('Level Up! 🌟', { body: `Congratulations! You reached Level ${res.newLevel}!` });
      }
      showToast(msg);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save amount';
      showToast(message, 'error');
      throw err;
    }
  }, [goals, refreshData, showToast]);

  const deleteGoal = useCallback(async (goalId: string) => {
    await api.deleteGoal(goalId);
    await refreshData();
    showToast('Dream removed');
    setSelectedGoal(null);
  }, [refreshData, showToast]);

  const updateMonthlyBudget = useCallback(async (amount: number) => {
    try {
      const res = await api.updateProfile({ monthlyBudget: amount });
      setUser(res.user);
      setStats(prev => {
        if (!prev) return prev;
        const spent = prev.monthlyExpenses;
        const vibe = buildVibeStats(spent, amount, prev.savingStreak);
        return {
          ...prev,
          monthlyBudget: amount,
          totalBalance: Math.max(0, amount - spent),
          budgetUsedPercent: vibe.spendingIntensity,
          savingsProgressPercent: amount > 0
            ? Math.min(100, Math.round((prev.monthlySavings / (amount * 0.2)) * 100))
            : 0,
          ...vibe,
        };
      });
      await refreshData();
      showToast(`Monthly budget set to ${fmtAmount(amount)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save budget';
      showToast(
        message.includes('fetch') || message.includes('Failed')
          ? 'Cannot reach server. Run: npm run dev'
          : message,
        'error'
      );
      throw err;
    }
  }, [refreshData, showToast]);

  return (
    <AppContext.Provider value={{
      user,
      goals,
      expenses,
      stats,
      loading,
      isAuthenticated: !!user,
      needsOnboarding: !!user && !user.onboardingComplete,
      login,
      verifyEmailCode,
      resendConfirmationCode,
      logout,
      completeOnboarding,
      refreshData,
      addExpense,
      addGoal,
      joinGoal,
      contributeToGoal,
      deleteGoal,
      updateMonthlyBudget,
      showToast,
      savingsDialogOpen,
      setSavingsDialogOpen,
      savingsGoalId,
      setSavingsGoalId,
      selectedGoal,
      setSelectedGoal,
      publicProfileId,
      setPublicProfileId,
    }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: 3, fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
