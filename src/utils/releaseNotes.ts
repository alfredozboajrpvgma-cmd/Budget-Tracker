import { APP_VERSION } from './version';

const RELEASE_SEEN_KEY = 'pinkcloud_release_seen';

export const RELEASE_CONTACT_EMAIL = 'alfredozboajr.pvgma@gmail.com';

export const RELEASE_FEATURES = [
  {
    icon: 'dashboard',
    title: 'Dashboard & Sunshine Score',
    description: 'See your budget vibe, monthly spending, and savings progress at a glance.',
  },
  {
    icon: 'dreams',
    title: 'Dreams & savings',
    description: 'Create savings goals and watch your cloud fill up as you contribute.',
  },
  {
    icon: 'expenses',
    title: 'Expense tracking',
    description: 'Tap + to log daily spending and keep tabs on where your money goes.',
  },
  {
    icon: 'shared',
    title: 'Shared dreams',
    description: 'Join friends with a dream code and save toward goals together.',
  },
  {
    icon: 'insights',
    title: 'Insights',
    description: 'View charts and analytics to understand your spending habits.',
  },
  {
    icon: 'trophies',
    title: 'XP, levels & trophies',
    description: 'Earn XP, level up, and unlock badges as you build better habits.',
  },
  {
    icon: 'notifications',
    title: 'Push notifications',
    description: 'Get reminders even when PinkCloud isn’t open — enable them in Settings.',
  },
  {
    icon: 'offline',
    title: 'Offline logging',
    description: 'Log expenses without internet; they sync automatically when you’re back online.',
  },
  {
    icon: 'install',
    title: 'Install as an app',
    description: 'Add PinkCloud to your home screen from Settings for a native-like experience.',
  },
  {
    icon: 'personalization',
    title: 'Personalization',
    description: 'Switch dark mode, change currency, and manage your profile anytime.',
  },
] as const;

export type ReleaseFeatureIcon = (typeof RELEASE_FEATURES)[number]['icon'];

export function shouldShowReleaseNotes(): boolean {
  try {
    return localStorage.getItem(RELEASE_SEEN_KEY) !== APP_VERSION;
  } catch {
    return true;
  }
}

export function markReleaseSeen(): void {
  try {
    localStorage.setItem(RELEASE_SEEN_KEY, APP_VERSION);
  } catch {
    // ignore
  }
}
