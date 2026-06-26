import { useEffect } from 'react';
import { api } from '../api/client';
import { flushPendingExpenses } from '../utils/offlineExpenses';
import { isOffline } from '../utils/network';

export function useOfflineExpenseSync(
  userId: string | undefined,
  refreshData: () => Promise<void>,
  showToast: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void,
) {
  useEffect(() => {
    if (!userId) return;

    const sync = async () => {
      if (isOffline()) return;

      const synced = await flushPendingExpenses(userId, data => api.createExpense(data));
      if (synced > 0) {
        await refreshData();
        showToast(
          synced === 1 ? '1 offline expense synced! ☁️' : `${synced} offline expenses synced! ☁️`,
          'success',
        );
      }
    };

    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [userId, refreshData, showToast]);
}
