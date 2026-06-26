export type CronConditionType =
  | 'scheduled'
  | 'inactive'
  | 'budget_warning'
  | 'no_budget'
  | 'no_expense_today'
  | 'no_expense_inactive'
  | 'no_savings_inactive'
  | 'quests_incomplete'
  | 'low_sunshine'
  | 'streak_active'
  | 'weekly'
  | 'monthly_start'
  | 'monthly_mid'
  | 'motivational';

export interface CronMessage {
  id: string;
  title: string;
  body: string;
  condition: CronConditionType;
  hour?: number;
  inactiveMinDays?: number;
  inactiveMaxDays?: number;
  budgetThreshold?: number;
  dayOfWeek?: number;
  cooldownHours: number;
}

export const CRON_MESSAGES: CronMessage[] = [
  { id: 'daily_morning', title: 'Good morning, Dreamer ☀️', body: 'Start your day strong — log yesterday\'s spending if you haven\'t yet.', condition: 'scheduled', hour: 8, cooldownHours: 20 },
  { id: 'daily_quests', title: 'New day, fresh sky ☁️', body: 'Your daily quests are ready. Complete them to earn XP!', condition: 'scheduled', hour: 8, cooldownHours: 20 },
  { id: 'daily_lunch', title: 'Lunch check-in 🍱', body: 'Log your meal expense now so you don\'t forget later.', condition: 'scheduled', hour: 12, cooldownHours: 20 },
  { id: 'daily_savings_nudge', title: 'Evening savings nudge 💰', body: 'Even a small amount today moves you closer to your dream.', condition: 'scheduled', hour: 18, cooldownHours: 20 },
  { id: 'daily_recap', title: 'End-of-day recap 📊', body: 'Review today\'s spending in Insights before you sleep.', condition: 'scheduled', hour: 21, cooldownHours: 20 },
  { id: 'daily_streak', title: 'Don\'t break your streak! 🔥', body: 'Log a saving or keep spending low to protect your vibe.', condition: 'scheduled', hour: 21, cooldownHours: 20 },
  { id: 'budget_50', title: 'Halfway there ⚠️', body: 'You\'ve used 50% of your monthly budget. Spend wisely!', condition: 'budget_warning', budgetThreshold: 50, cooldownHours: 72 },
  { id: 'budget_70', title: 'Clouds are gathering 🌧️', body: 'You\'ve used 70% of your budget. Your vibe is dropping!', condition: 'budget_warning', budgetThreshold: 70, cooldownHours: 48 },
  { id: 'budget_90', title: 'Storm warning ⛈️', body: 'Only 10% of your budget left this month. Slow down!', condition: 'budget_warning', budgetThreshold: 90, cooldownHours: 24 },
  { id: 'budget_exceeded', title: 'Budget exceeded 🚨', body: 'You\'ve gone over your monthly budget. Check Insights now.', condition: 'budget_warning', budgetThreshold: 100, cooldownHours: 24 },
  { id: 'no_budget', title: 'Set your budget 🎯', body: 'Add a monthly budget so PinkCloud can track your rain meter.', condition: 'no_budget', cooldownHours: 168 },
  { id: 'no_expense_today', title: 'We miss your logs 💸', body: 'Haven\'t logged an expense today. Keep your records accurate!', condition: 'no_expense_today', hour: 20, cooldownHours: 24 },
  { id: 'quests_incomplete', title: 'Quests waiting ❯', body: 'You still have daily quests left. Earn XP before midnight!', condition: 'quests_incomplete', hour: 19, cooldownHours: 24 },
  { id: 'low_sunshine', title: 'Rainy day ahead 🌧️', body: 'Your vibe is low from spending. Log less, save more!', condition: 'low_sunshine', cooldownHours: 48 },
  { id: 'streak_active', title: 'Streak going strong 🔥', body: 'Your saving streak is active. Keep the sunshine score rising!', condition: 'streak_active', hour: 9, cooldownHours: 24 },
  { id: 'inactive_1d', title: 'We saved a spot for you ☁️', body: 'You haven\'t checked PinkCloud today. Log an expense or add savings in seconds.', condition: 'inactive', inactiveMinDays: 1, inactiveMaxDays: 2, cooldownHours: 24 },
  { id: 'inactive_3d', title: 'Quick check-in? 💸', body: 'No activity in 3 days. A quick log keeps your budget accurate.', condition: 'inactive', inactiveMinDays: 3, inactiveMaxDays: 5, cooldownHours: 48 },
  { id: 'inactive_7d', title: 'One week away ☁️', body: 'We miss you! Your dreams and budget are still here — pick up where you left off.', condition: 'inactive', inactiveMinDays: 7, inactiveMaxDays: 14, cooldownHours: 72 },
  { id: 'inactive_14d', title: 'Your dreams miss you ✨', body: 'It\'s been 2 weeks. Even one small saving today can restart your streak.', condition: 'inactive', inactiveMinDays: 14, inactiveMaxDays: 30, cooldownHours: 96 },
  { id: 'inactive_30d', title: 'Welcome back anytime ☁️', body: 'It\'s been a while! Your account is ready whenever you want to save again.', condition: 'inactive', inactiveMinDays: 30, inactiveMaxDays: 365, cooldownHours: 168 },
  { id: 'inactive_no_expense_3d', title: 'Forgot to log? 📝', body: 'No expenses logged in 3 days. Tap + to keep your records up to date.', condition: 'no_expense_inactive', inactiveMinDays: 3, inactiveMaxDays: 7, cooldownHours: 48 },
  { id: 'inactive_no_expense_7d', title: 'Spending blind? 💸', body: 'A week without expense logs. You can\'t improve what you don\'t track.', condition: 'no_expense_inactive', inactiveMinDays: 7, inactiveMaxDays: 14, cooldownHours: 72 },
  { id: 'inactive_no_savings_5d', title: 'Your dream is paused ⏸️', body: 'No savings in 5 days. Even a small amount moves you closer.', condition: 'no_savings_inactive', inactiveMinDays: 5, inactiveMaxDays: 10, cooldownHours: 48 },
  { id: 'inactive_no_savings_10d', title: 'Feed your dream ☁️', body: '10 days without saving. Open a dream and add what you can today.', condition: 'no_savings_inactive', inactiveMinDays: 10, inactiveMaxDays: 30, cooldownHours: 72 },
  { id: 'weekly_monday', title: 'Weekly kickoff 📅', body: 'New week, new goals. Set your spending plan for the next 7 days.', condition: 'weekly', dayOfWeek: 1, hour: 9, cooldownHours: 144 },
  { id: 'weekly_sunday', title: 'Weekly wrap-up 📈', body: 'Review your week in Insights — see where your money went.', condition: 'weekly', dayOfWeek: 0, hour: 20, cooldownHours: 144 },
  { id: 'monthly_start', title: 'New month, fresh budget 🗓️', body: 'It\'s a new month! Update your budget and chase new dreams.', condition: 'monthly_start', hour: 9, cooldownHours: 672 },
  { id: 'monthly_mid', title: 'Mid-month check ⚖️', body: 'Half the month is gone. Are you on track with your budget?', condition: 'monthly_mid', hour: 10, cooldownHours: 672 },
  { id: 'motivational_1', title: 'PinkCloud reminder ☁️', body: 'Small steps build big dreams. Save a little today.', condition: 'motivational', hour: 15, cooldownHours: 24 },
  { id: 'motivational_2', title: 'PinkCloud reminder 💸', body: 'Track it to tame it — log every expense.', condition: 'motivational', hour: 15, cooldownHours: 24 },
  { id: 'motivational_3', title: 'PinkCloud reminder 💰', body: 'Your future self will thank you for saving today.', condition: 'motivational', hour: 15, cooldownHours: 24 },
  { id: 'motivational_4', title: 'PinkCloud reminder ☀️', body: 'Clear skies come from smart spending.', condition: 'motivational', hour: 15, cooldownHours: 24 },
  { id: 'motivational_5', title: 'PinkCloud reminder ✨', body: 'Dreams don\'t fund themselves — add savings now!', condition: 'motivational', hour: 15, cooldownHours: 24 },
  { id: 'motivational_6', title: 'PinkCloud reminder 📊', body: 'Know your numbers, own your month.', condition: 'motivational', hour: 15, cooldownHours: 24 },
  { id: 'motivational_7', title: 'PinkCloud reminder 🌧️', body: 'Check your Rain Meter before you spend again.', condition: 'motivational', hour: 15, cooldownHours: 24 },
  { id: 'motivational_8', title: 'Hey Dreamer ☁️', body: 'PinkCloud is quieter without you. Drop in for 30 seconds.', condition: 'motivational', hour: 15, cooldownHours: 24 },
];
