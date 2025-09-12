// service-worker.js

// Listen for push events
self.addEventListener('push', event => {
  let data = { title: 'New Message', body: 'You have a new message', icon: '/images/icon.png' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      console.error('Push event data is not JSON:', err);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/icon.png',
    badge: '/images/icon.png',
    data: { url: '/contact.html' } // URL to open on click
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/contact.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window if not already open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Optional: receive messages from the page (can be used for local updates)
self.addEventListener('message', event => {
  console.log('Service worker received message:', event.data);
});
