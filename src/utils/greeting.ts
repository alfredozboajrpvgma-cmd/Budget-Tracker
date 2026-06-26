export function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

export const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍔',
  Transportation: '🚕',
  School: '📚',
  Bills: '📄',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Other: '📦',
};
