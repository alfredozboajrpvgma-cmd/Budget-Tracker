import { toNumber } from './format';

export function calculateSpendingIntensity(monthlyExpenses: number, monthlyBudget: number): number {
  const expenses = toNumber(monthlyExpenses);
  const budget = toNumber(monthlyBudget);

  if (budget > 0) {
    return Math.min(100, Math.round((expenses / budget) * 100));
  }

  // No budget set — spending still lowers vibe (~1% per ₱200 spent)
  if (expenses <= 0) return 0;
  return Math.min(100, Math.round(expenses / 200));
}

export function calculateSunshineScore(spendingIntensity: number, savingStreak: number): number {
  const streakBonus = Math.min(30, toNumber(savingStreak) * 3);
  return Math.max(0, Math.min(100, 100 - spendingIntensity + streakBonus));
}

export function getRainLabel(spendingIntensity: number): string {
  if (spendingIntensity > 70) return 'Stormy';
  if (spendingIntensity > 40) return 'Rainy';
  if (spendingIntensity > 15) return 'Drizzle';
  return 'Clear Skies';
}

export function getVibeLabel(sunshineScore: number, monthlyExpenses = 0): string {
  const score = toNumber(sunshineScore);
  const expenses = toNumber(monthlyExpenses);

  if (expenses <= 0 && score >= 70) return 'Clear Sky';
  if (score >= 70) return 'Zen Master Saver';
  if (score >= 40) return 'Balanced Cloud';
  if (score >= 15) return 'Partly Cloudy';
  if (score > 0) return 'Rainy Day';
  return 'Stormy Skies';
}

export function getVibeMessage(
  monthlyExpenses: number,
  monthlySavings: number,
  budgetUsedPercent: number,
  fmt: (amount: number) => string,
): string {
  const expenses = toNumber(monthlyExpenses);
  const savings = toNumber(monthlySavings);

  if (expenses > 0 && savings > 0) {
    return `You spent ${fmt(expenses)} but saved ${fmt(savings)} too — keep balancing!`;
  }
  if (expenses > 0) {
    if (budgetUsedPercent > 70) {
      return `You spent ${fmt(expenses)} this month. Slow down — your vibe is dropping! 🌧️`;
    }
    return `You spent ${fmt(expenses)} this month. More spending means more rain in your sky.`;
  }
  if (savings > 0) {
    return `You've saved ${fmt(savings)} this month. Keep it up! ☀️`;
  }
  return 'Log an expense or add savings to build your vibe!';
}

export function buildVibeStats(
  monthlyExpenses: number,
  monthlyBudget: number,
  savingStreak: number,
) {
  const spendingIntensity = calculateSpendingIntensity(monthlyExpenses, monthlyBudget);
  const sunshineScore = calculateSunshineScore(spendingIntensity, savingStreak);
  const rainLabel = getRainLabel(spendingIntensity);

  return { spendingIntensity, sunshineScore, rainLabel };
}
