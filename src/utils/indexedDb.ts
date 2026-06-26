const DB_NAME = 'pinkcloud';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;
let migrationPromise: Promise<void> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('pendingExpenses')) {
          const store = db.createObjectStore('pendingExpenses', { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains('userCache')) {
          db.createObjectStore('userCache', { keyPath: 'id' });
        }
      };
    });
  }

  return dbPromise;
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  const result = await new Promise<T>((resolve, reject) => {
    const output = run(store);
    if (output instanceof Promise) {
      output.then(resolve).catch(reject);
      return;
    }
    output.onsuccess = () => resolve(output.result as T);
    output.onerror = () => reject(output.error ?? new Error(`IndexedDB error on ${storeName}`));
  });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error(`IndexedDB transaction failed on ${storeName}`));
    tx.onabort = () => reject(tx.error ?? new Error(`IndexedDB transaction aborted on ${storeName}`));
  });
  return result;
}

export async function idbGet<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  return withStore(storeName, 'readonly', store => store.get(key));
}

export async function idbPut<T>(storeName: string, value: T): Promise<IDBValidKey> {
  return withStore(storeName, 'readwrite', store => store.put(value));
}

export async function idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
  await withStore(storeName, 'readwrite', store => store.delete(key));
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  return withStore(storeName, 'readonly', store => store.getAll());
}

export async function idbGetAllByIndex<T>(
  storeName: string,
  indexName: string,
  query: IDBValidKey,
): Promise<T[]> {
  return withStore(storeName, 'readonly', store => store.index(indexName).getAll(query));
}

async function migrateLegacyLocalStorage() {
  const legacyExpenses = localStorage.getItem('pinkcloud_pending_expenses');
  if (legacyExpenses) {
    try {
      const items = JSON.parse(legacyExpenses) as unknown[];
      if (Array.isArray(items)) {
        for (const item of items) {
          await idbPut('pendingExpenses', item);
        }
      }
    } catch {
      // ignore invalid legacy data
    }
    localStorage.removeItem('pinkcloud_pending_expenses');
  }

  const legacyUser = localStorage.getItem('pinkcloud_cached_user');
  if (legacyUser) {
    try {
      const user = JSON.parse(legacyUser);
      await idbPut('userCache', { id: 'current', user, updatedAt: new Date().toISOString() });
    } catch {
      // ignore invalid legacy data
    }
    localStorage.removeItem('pinkcloud_cached_user');
  }
}

export async function initIndexedDb(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      await openDatabase();
      await migrateLegacyLocalStorage();
    })();
  }
  await migrationPromise;
}
