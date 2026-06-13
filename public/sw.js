self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const payload = event.data.json();
      
      const title = payload.title || 'ข้อความใหม่จากระบบ';
      const options = {
        body: payload.body || '',
        icon: payload.icon || '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
          url: payload.data ? payload.data.url : '/chat'
        }
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      console.error('[SW PUSH ERROR]:', e);
      // Fallback for plain text push
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('ข้อความใหม่จากระบบ', {
          body: text,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: { url: '/chat' }
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const targetUrl = event.notification.data ? event.notification.data.url : '/chat';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there is already a window open with the same origin
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.navigate(targetUrl).then(function(c) {
            return c.focus();
          });
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
