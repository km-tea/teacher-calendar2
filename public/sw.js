self.addEventListener('push', (e) => {
  const d = e.data ? e.data.json() : { title: '일정 알림' };
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, tag: d.tag, icon: '/icon.svg', requireInteraction: true }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then((l) => (l.length ? l[0].focus() : clients.openWindow('/'))));
});
