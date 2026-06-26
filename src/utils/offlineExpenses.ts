import { idbDelete, idbGetAllByIndex, idbPut, initIndexedDb } from './indexedDb';

export interface PendingExpense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  note: string;
  createdAt: string;
}

export async function getPendingExpensesForUser(userId: string): Promise<PendingExpense[]> {
  await initIndexedDb();
  const items = await idbGetAllByIndex<PendingExpense>('pendingExpenses', 'userId', userId);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function enqueuePendingExpense(
  userId: string,
  data: { amount: number; category: string; note: string },
): Promise<PendingExpense> {
  await initIndexedDb();
  const item: PendingExpense = {
    id: `offline-${crypto.randomUUID()}`,
    userId,
    amount: data.amount,
    category: data.category,
    note: data.note,
    createdAt: new Date().toISOString(),
  };
  await idbPut('pendingExpenses', item);
  return item;
}

export async function removePendingExpense(id: string): Promise<void> {
  await initIndexedDb();
  await idbDelete('pendingExpenses', id);
}

export function pendingToExpense(item: PendingExpense) {
  return {
    id: item.id,
    amount: item.amount,
    category: item.category,
    note: item.note,
    date: item.createdAt,
    createdAt: item.createdAt,
    pending: true as const,
  };
}

export async function flushPendingExpenses(
  userId: string,
  createExpense: (data: { amount: number; category: string; note: string }) => Promise<unknown>,
): Promise<number> {
  const pending = [...(await getPendingExpensesForUser(userId))].reverse();
  let synced = 0;

  for (const item of pending) {
    try {
      await createExpense({
        amount: item.amount,
        category: item.category,
        note: item.note,
      });
      await removePendingExpense(item.id);
      synced += 1;
    } catch {
      break;
    }
  }

  return synced;
}
