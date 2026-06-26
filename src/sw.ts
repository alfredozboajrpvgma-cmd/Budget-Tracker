/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
self.skipWaiting();
clientsClaim();

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pinkcloud-pages',
    networkTimeoutSeconds: 8,
    plugins: [new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 })],
  }),
);

registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'pinkcloud-api',
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 })],
  }),
);

self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string; tag?: string } = {
    title: 'PinkCloud',
    body: 'You have a new reminder.',
    tag: 'pinkcloud',
  };

  try {
    data = { ...data, ...event.data?.json() };
  } catch {
    // use defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'PinkCloud', {
      body: data.body,
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
      tag: data.tag || 'pinkcloud',
      data: { url: '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    }),
  );
});
