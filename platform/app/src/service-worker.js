navigator.serviceWorker.getRegistrations().then(function (registrations) {
  for (let registration of registrations) {
    registration.unregister();
  }
});

// https://developers.google.com/web/tools/workbox/guides/troubleshoot-and-debug
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

// Install newest
// https://developers.google.com/web/tools/workbox/modules/workbox-core
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// Runtime plugins under /plugins/ are deployed/updated independently of the
// app build; never serve them from SW caches. ORDER IS LOAD-BEARING: workbox
// uses first-registered-match, so this must stay ABOVE the 'static-resources'
// route below. The precache manifest also excludes plugins/ (see
// InjectServiceWorkerManifestPlugin `exclude` in rspack.pwa.js).
workbox.routing.registerRoute(
  ({ url }) => url.pathname.includes('/plugins/'),
  new workbox.strategies.NetworkOnly()
);

// Cache static assets that aren't precached
workbox.routing.registerRoute(
  /\.(?:js|css|json5|jsonc)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache the underlying font files with a cache-first strategy for 1 year.
workbox.routing.registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new workbox.strategies.CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
        maxEntries: 30,
      }),
    ],
  })
);

// MESSAGE HANDLER
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        // TODO: We'll eventually want this to be user prompted
        // workbox.core.skipWaiting();
        // workbox.core.clientsClaim();
        // TODO: Global notification to indicate incoming reload
        break;

      default:
        console.warn(`SW: Invalid message type: ${event.data.type}`);
    }
  }
});

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// TODO: Cache API
// https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/cache-api
// Store DICOMs?
// Clear Service Worker cache?
// navigator.storage.estimate().then(est => console.log(est)); (2GB?)
