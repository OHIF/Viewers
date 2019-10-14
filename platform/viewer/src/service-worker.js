// https://developers.google.com/web/tools/workbox/guides/troubleshoot-and-debug
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js'
);

// workbox.core.skipWaiting();
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

// PUSH EVENTS HANDLER
self.addEventListener('push', event => {
  const title = 'Get Started With Workbox';
  const options = {
    body: event.data.text(),
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// MESSAGE HANDLER
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        workbox.core.skipWaiting();
        break;

      default:
        console.warn(`SW: Invalid message type: ${event.data.type}`);
    }
  }
});

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// This "catch" handler is triggered when any of the other routes fail to
// generate a response.
workbox.routing.setCatchHandler(({ event }) => {
  // The FALLBACK_URL entries must be added to the cache ahead of time, either via runtime
  // or precaching.
  // If they are precached, then call workbox.precaching.getCacheKeyForURL(FALLBACK_URL)
  // to get the correct cache key to pass in to caches.match().
  //
  // Use event, request, and url to figure out how to respond.
  // One approach would be to use request.destination, see
  // https://medium.com/dev-channel/service-worker-caching-strategies-based-on-request-types-57411dd7652c
  switch (event.request.destination) {
    case 'document':
      return caches.match(FALLBACK_HTML_URL);
      break;

    case 'image':
      return caches.match(FALLBACK_IMAGE_URL);
      break;

    case 'font':
      return caches.match(FALLBACK_FONT_URL);
      break;

    default:
      // If we don't have a fallback, just return an error response.
      return Response.error();
  }
});

// TODO: Cache API
// https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/cache-api
// Store DICOMs?
// Clear Service Worker cache?
// navigator.storage.estimate().then(est => console.log(est)); (2GB?)
