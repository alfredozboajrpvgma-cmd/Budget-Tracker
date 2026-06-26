import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'pinkcloud.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    name TEXT DEFAULT '',
    avatar_seed TEXT DEFAULT 'Felix',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    level_title TEXT DEFAULT 'Cloud Builder',
    monthly_budget REAL DEFAULT 5000,
    onboarding_complete INTEGER DEFAULT 0,
    saving_streak INTEGER DEFAULT 0,
    last_save_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'Other',
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS savings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quest_progress (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    progress_amount REAL DEFAULT 0,
    PRIMARY KEY (user_id, quest_id)
  );
`);

export interface UserRow {
  id: string;
  email: string | null;
  name: string;
  avatar_seed: string;
  xp: number;
  level: number;
  level_title: string;
  monthly_budget: number;
  onboarding_complete: number;
  saving_streak: number;
  last_save_date: string | null;
  created_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  type: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
}

export interface ExpenseRow {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  note: string;
  created_at: string;
}

export function createUser(data: {
  email?: string;
  passwordHash?: string;
  name?: string;
  avatarSeed?: string;
}): UserRow {
  const id = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, avatar_seed)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    data.email ?? null,
    data.passwordHash ?? null,
    data.name ?? '',
    data.avatarSeed ?? 'Felix'
  );
  return getUserById(id)!;
}

export function getUserById(id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
}

export function updateUser(id: string, fields: Partial<{
  name: string;
  avatar_seed: string;
  xp: number;
  level: number;
  level_title: string;
  monthly_budget: number;
  onboarding_complete: number;
  saving_streak: number;
  last_save_date: string;
}>): UserRow | undefined {
  const allowed = ['name', 'avatar_seed', 'xp', 'level', 'level_title', 'monthly_budget', 'onboarding_complete', 'saving_streak', 'last_save_date'] as const;
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }
  if (sets.length === 0) return getUserById(id);
  values.push(id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getUserById(id);
}

export function createSession(userId: string): string {
  const token = randomUUID();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

export function getUserByToken(token: string): UserRow | undefined {
  const row = db.prepare(`
    SELECT u.* FROM users u
    JOIN sessions s ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token) as UserRow | undefined;
  return row;
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function getGoals(userId: string): GoalRow[] {
  return db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(userId) as GoalRow[];
}

export function createGoal(userId: string, data: { title: string; type: string; targetAmount: number }): GoalRow {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO goals (id, user_id, title, type, target_amount)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, data.title, data.type, data.targetAmount);
  return db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as GoalRow;
}

export function getGoalById(id: string): GoalRow | undefined {
  return db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as GoalRow | undefined;
}

export function updateGoalAmount(goalId: string, amount: number): GoalRow | undefined {
  db.prepare('UPDATE goals SET current_amount = current_amount + ? WHERE id = ?').run(amount, goalId);
  return getGoalById(goalId);
}

export function deleteGoal(goalId: string, userId: string): boolean {
  const result = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(goalId, userId);
  return result.changes > 0;
}

export function getExpenses(userId: string): ExpenseRow[] {
  return db.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC').all(userId) as ExpenseRow[];
}

export function createExpense(userId: string, data: { amount: number; category: string; note: string }): ExpenseRow {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO expenses (id, user_id, amount, category, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, data.amount, data.category, data.note);
  return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as ExpenseRow;
}

export function deleteExpense(id: string, userId: string): boolean {
  const result = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

export function createSaving(userId: string, goalId: string, amount: number): void {
  const id = randomUUID();
  db.prepare('INSERT INTO savings (id, user_id, goal_id, amount) VALUES (?, ?, ?, ?)').run(id, userId, goalId, amount);
}

export function getQuestProgress(userId: string): { quest_id: string; completed: number; progress_amount: number }[] {
  return db.prepare('SELECT quest_id, completed, progress_amount FROM quest_progress WHERE user_id = ?').all(userId) as { quest_id: string; completed: number; progress_amount: number }[];
}

export function upsertQuestProgress(userId: string, questId: string, completed: boolean, progressAmount?: number): void {
  const existing = db.prepare('SELECT * FROM quest_progress WHERE user_id = ? AND quest_id = ?').get(userId, questId);
  if (existing) {
    db.prepare(`
      UPDATE quest_progress SET completed = ?, progress_amount = COALESCE(?, progress_amount)
      WHERE user_id = ? AND quest_id = ?
    `).run(completed ? 1 : 0, progressAmount ?? null, userId, questId);
  } else {
    db.prepare(`
      INSERT INTO quest_progress (user_id, quest_id, completed, progress_amount)
      VALUES (?, ?, ?, ?)
    `).run(userId, questId, completed ? 1 : 0, progressAmount ?? 0);
  }
}

export function getMonthlyExpenses(userId: string): number {
  const row = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).get(userId) as { total: number };
  return row.total;
}

export function getMonthlySavings(userId: string): number {
  const row = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM savings
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).get(userId) as { total: number };
  return row.total;
}

export function getTodaySavings(userId: string): number {
  const row = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM savings
    WHERE user_id = ? AND date(created_at) = date('now')
  `).get(userId) as { total: number };
  return row.total;
}

export function getCategoryBreakdown(userId: string): { category: string; total: number }[] {
  return db.prepare(`
    SELECT category, SUM(amount) as total FROM expenses
    WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    GROUP BY category ORDER BY total DESC
  `).all(userId) as { category: string; total: number }[];
}

export default db;
