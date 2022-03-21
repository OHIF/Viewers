// https://developers.google.com/web/tools/workbox/guides/troubleshoot-and-debug

//
// Uncomment the 'Embedded version' and use the 'Internet version' if
// the internet version is preferred. Make sure to use the correct
// version though.
//

// Embedded version
importScripts('/third_party/workbox/workbox-v5.1.4/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: '/third_party/workbox/workbox-v5.1.4/',
});

// Internet version
/*
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js'
);
*/

// Install newest
// https://developers.google.com/web/tools/workbox/modules/workbox-core
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// Cache static assets that aren't precached
workbox.routing.registerRoute(
  /\.(?:js|css)$/,
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
