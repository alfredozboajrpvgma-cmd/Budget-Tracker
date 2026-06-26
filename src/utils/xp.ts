export const XP_PER_LEVEL = 1000;

export function xpForLevel(_level: number = 1): number {
  return XP_PER_LEVEL;
}

export function xpProgressPercent(xp: number, level: number = 1): number {
  const needed = xpForLevel(level);
  return needed > 0 ? Math.min(100, Math.round((xp / needed) * 100)) : 0;
}
