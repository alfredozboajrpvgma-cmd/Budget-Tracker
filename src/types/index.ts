export interface User {
  id: string;
  email: string | null;
  name: string;
  avatarSeed: string;
  xp: number;
  level: number;
  levelTitle: string;
  monthlyBudget: number;
  onboardingComplete: boolean;
  savingStreak: number;
}

export interface Goal {
  id: number | string;
  title: string;
  type: string;
  progress: number;
  currentAmount: number;
  targetAmount: number;
  shareCode?: string;
  sharedWith?: string[];
  createdAt?: string;
  userId?: string;
  ownerName?: string;
  currencySymbol?: string;
}

export interface Expense {
  id: number | string;
  amount: number;
  category: string;
  note: string;
  date: string;
  createdAt?: string;
  pending?: boolean;
}

export interface Stats {
  totalBalance: number;
  monthlyBudget: number;
  monthlyExpenses: number;
  monthlySavings: number;
  todaySavings: number;
  budgetUsedPercent: number;
  savingsProgressPercent: number;
  totalSaved: number;
  dreamProgressPercent: number;
  xp: number;
  xpNeeded: number;
  xpProgressPercent: number;
  level: number;
  levelTitle: string;
  savingStreak: number;
  sunshineScore: number;
  spendingIntensity: number;
  rainLabel: string;
  categoryBreakdown: { category: string; total: number; percent: number }[];
  quests: DynamicQuest[];
  questsCompleted: number;
}

export type ExpenseCategory = 'Food' | 'Transportation' | 'School' | 'Bills' | 'Shopping' | 'Entertainment' | 'Other';

export interface DynamicQuest {
  id: string;
  type: 'save';
  title: string;
  completed: boolean;
  progress: number;
  target: number;
  xpReward: number;
}
