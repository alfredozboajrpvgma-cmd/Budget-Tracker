import type { User } from '../types';
import { idbDelete, idbGet, idbPut, initIndexedDb } from './indexedDb';

interface CachedUserRecord {
  id: 'current';
  user: User;
  updatedAt: string;
}

export async function setCachedUser(user: User): Promise<void> {
  await initIndexedDb();
  await idbPut<CachedUserRecord>('userCache', {
    id: 'current',
    user,
    updatedAt: new Date().toISOString(),
  });
}

export async function getCachedUser(): Promise<User | null> {
  await initIndexedDb();
  const record = await idbGet<CachedUserRecord>('userCache', 'current');
  return record?.user ?? null;
}

export async function clearCachedUser(): Promise<void> {
  await initIndexedDb();
  await idbDelete('userCache', 'current');
}
