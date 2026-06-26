export function normalizeGoalAmounts(currentAmount: number, targetAmount: number) {
  const cappedCurrent = targetAmount > 0 ? Math.min(currentAmount, targetAmount) : currentAmount;
  const progress =
    targetAmount > 0 ? Math.min(100, Math.round((cappedCurrent / targetAmount) * 100)) : 0;

  return { currentAmount: cappedCurrent, targetAmount, progress };
}

export function getGoalRemainingAmount(currentAmount: number, targetAmount: number): number {
  return Math.max(0, targetAmount - Math.min(currentAmount, targetAmount));
}
