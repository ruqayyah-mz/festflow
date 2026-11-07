/* FestFlow service worker: shows Web Push notifications (e.g. "New task assigned").
 * On Android Chrome these appear in the phone's notification shade even when the tab is closed.
 * Payload is sent by supabase/functions/push-notifications: { title, body, url, tag, data }. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'FestFlow';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      tag: payload.tag, // same task -> replaces instead of stacking
      renotify: Boolean(payload.tag),
      icon: '/icon-192.png',
      badge: '/badge-96.png',
      data: { url: payload.url || '/', ...(payload.data || {}) },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      // Reuse an open FestFlow tab if there is one.
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          client.navigate(target).catch(() => undefined);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
