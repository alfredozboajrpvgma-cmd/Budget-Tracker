export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
export const APP_BUILD_TIME = import.meta.env.VITE_APP_BUILD_TIME ?? '';

export function formatBuildDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return '';
  }
}
