import { supabase } from '../api/supabaseClient';
import { getServiceWorkerRegistration } from './serviceWorker';

const PUSH_REGISTERED_KEY = 'pinkcloud_push_registered';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function isPushRegistered(): boolean {
  return localStorage.getItem(PUSH_REGISTERED_KEY) === 'true';
}

export function setPushRegistered(registered: boolean) {
  localStorage.setItem(PUSH_REGISTERED_KEY, registered ? 'true' : 'false');
}

export async function registerPushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser');
    return false;
  }

  const token = await getAccessToken();
  if (!token) return false;

  const keyRes = await fetch('/api/push/vapid-public-key');
  if (!keyRes.ok) throw new Error('Push server not configured. Run: npm run server');
  const { publicKey } = await keyRes.json();

  const registration = await getServiceWorkerRegistration();
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to register push subscription');
  }

  setPushRegistered(true);
  return true;
}

export async function unregisterPushSubscription(): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();

  await fetch('/api/push/subscribe', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ endpoint: subscription?.endpoint }),
  }).catch(() => undefined);

  await subscription?.unsubscribe();
  setPushRegistered(false);
}

export async function pingActivity(
  type: 'active' | 'expense' | 'saving' = 'active',
  notificationsEnabled?: boolean,
): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  await fetch('/api/push/activity', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, notificationsEnabled }),
  }).catch(() => undefined);
}
