import { APP_VERSION } from './version';

const RELEASE_SEEN_KEY = 'pinkcloud_release_seen';

export const RELEASE_CONTACT_EMAIL = 'alfredozboajr.pvgma@gmail.com';

export const RELEASE_FEATURES = [
  {
    icon: 'personalization',
    title: 'Profile Overhaul',
    description: 'Cleaner layout, matching XP bar, and dynamic Vibe icons based on your saving habits.',
  },
  {
    icon: 'install',
    title: 'Settings Drawer',
    description: 'Settings moved to a handy new side drawer for better accessibility.',
  },
  {
    icon: 'insights',
    title: 'Privacy & Legal Pages',
    description: 'Full dedicated Privacy Policy and Terms of Service pages, now with CCPA compliance.',
  },
  {
    icon: 'notifications',
    title: 'Account Deletion',
    description: 'You can now request account deletion directly from the Settings menu.',
  },
  {
    icon: 'dashboard',
    title: 'Visual Polish',
    description: 'Better typography, smoother backgrounds, and sleeker button styles across the app.',
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
