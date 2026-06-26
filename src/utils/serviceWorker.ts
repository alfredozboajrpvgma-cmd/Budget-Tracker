export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser');
  }

  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;

  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}
