// Offline precaching is intentionally disabled for the hosted viewer. The
// imaging runtime is too large for a reliable first load on cellular networks.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });

  if ('caches' in window) {
    caches.keys().then(keys => {
      keys.forEach(key => caches.delete(key));
    });
  }
}
