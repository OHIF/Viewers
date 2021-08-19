this.workbox = this.workbox || {};
this.workbox.expiration = (function (exports, assert_js, dontWaitFor_js, logger_js, WorkboxError_js, DBWrapper_js, deleteDatabase_js, cacheNames_js, getFriendlyURL_js, registerQuotaErrorCallback_js) {
    'use strict';

    try {
      self['workbox:expiration:5.1.4'] && _();
    } catch (e) {}

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    const DB_NAME = 'workbox-expiration';
    const OBJECT_STORE_NAME = 'cache-entries';

    const normalizeURL = unNormalizedUrl => {
      const url = new URL(unNormalizedUrl, location.href);
      url.hash = '';
      return url.href;
    };
    /**
     * Returns the timestamp model.
     *
     * @private
     */


    class CacheTimestampsModel {
      /**
       *
       * @param {string} cacheName
       *
       * @private
       */
      constructor(cacheName) {
        this._cacheName = cacheName;
        this._db = new DBWrapper_js.DBWrapper(DB_NAME, 1, {
          onupgradeneeded: event => this._handleUpgrade(event)
        });
      }
      /**
       * Should perform an upgrade of indexedDB.
       *
       * @param {Event} event
       *
       * @private
       */


      _handleUpgrade(event) {
        const db = event.target.result; // TODO(philipwalton): EdgeHTML doesn't support arrays as a keyPath, so we
        // have to use the `id` keyPath here and create our own values (a
        // concatenation of `url + cacheName`) instead of simply using
        // `keyPath: ['url', 'cacheName']`, which is supported in other browsers.

        const objStore = db.createObjectStore(OBJECT_STORE_NAME, {
          keyPath: 'id'
        }); // TODO(philipwalton): once we don't have to support EdgeHTML, we can
        // create a single index with the keyPath `['cacheName', 'timestamp']`
        // instead of doing both these indexes.

        objStore.createIndex('cacheName', 'cacheName', {
          unique: false
        });
        objStore.createIndex('timestamp', 'timestamp', {
          unique: false
        }); // Previous versions of `workbox-expiration` used `this._cacheName`
        // as the IDBDatabase name.

        deleteDatabase_js.deleteDatabase(this._cacheName);
      }
      /**
       * @param {string} url
       * @param {number} timestamp
       *
       * @private
       */


      async setTimestamp(url, timestamp) {
        url = normalizeURL(url);
        const entry = {
          url,
          timestamp,
          cacheName: this._cacheName,
          // Creating an ID from the URL and cache name won't be necessary once
          // Edge switches to Chromium and all browsers we support work with
          // array keyPaths.
          id: this._getId(url)
        };
        await this._db.put(OBJECT_STORE_NAME, entry);
      }
      /**
       * Returns the timestamp stored for a given URL.
       *
       * @param {string} url
       * @return {number}
       *
       * @private
       */


      async getTimestamp(url) {
        const entry = await this._db.get(OBJECT_STORE_NAME, this._getId(url));
        return entry.timestamp;
      }
      /**
       * Iterates through all the entries in the object store (from newest to
       * oldest) and removes entries once either `maxCount` is reached or the
       * entry's timestamp is less than `minTimestamp`.
       *
       * @param {number} minTimestamp
       * @param {number} maxCount
       * @return {Array<string>}
       *
       * @private
       */


      async expireEntries(minTimestamp, maxCount) {
        const entriesToDelete = await this._db.transaction(OBJECT_STORE_NAME, 'readwrite', (txn, done) => {
          const store = txn.objectStore(OBJECT_STORE_NAME);
          const request = store.index('timestamp').openCursor(null, 'prev');
          const entriesToDelete = [];
          let entriesNotDeletedCount = 0;

          request.onsuccess = () => {
            const cursor = request.result;

            if (cursor) {
              const result = cursor.value; // TODO(philipwalton): once we can use a multi-key index, we
              // won't have to check `cacheName` here.

              if (result.cacheName === this._cacheName) {
                // Delete an entry if it's older than the max age or
                // if we already have the max number allowed.
                if (minTimestamp && result.timestamp < minTimestamp || maxCount && entriesNotDeletedCount >= maxCount) {
                  // TODO(philipwalton): we should be able to delete the
                  // entry right here, but doing so causes an iteration
                  // bug in Safari stable (fixed in TP). Instead we can
                  // store the keys of the entries to delete, and then
                  // delete the separate transactions.
                  // https://github.com/GoogleChrome/workbox/issues/1978
                  // cursor.delete();
                  // We only need to return the URL, not the whole entry.
                  entriesToDelete.push(cursor.value);
                } else {
                  entriesNotDeletedCount++;
                }
              }

              cursor.continue();
            } else {
              done(entriesToDelete);
            }
          };
        }); // TODO(philipwalton): once the Safari bug in the following issue is fixed,
        // we should be able to remove this loop and do the entry deletion in the
        // cursor loop above:
        // https://github.com/GoogleChrome/workbox/issues/1978

        const urlsDeleted = [];

        for (const entry of entriesToDelete) {
          await this._db.delete(OBJECT_STORE_NAME, entry.id);
          urlsDeleted.push(entry.url);
        }

        return urlsDeleted;
      }
      /**
       * Takes a URL and returns an ID that will be unique in the object store.
       *
       * @param {string} url
       * @return {string}
       *
       * @private
       */


      _getId(url) {
        // Creating an ID from the URL and cache name won't be necessary once
        // Edge switches to Chromium and all browsers we support work with
        // array keyPaths.
        return this._cacheName + '|' + normalizeURL(url);
      }

    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * The `CacheExpiration` class allows you define an expiration and / or
     * limit on the number of responses stored in a
     * [`Cache`](https://developer.mozilla.org/en-US/docs/Web/API/Cache).
     *
     * @memberof module:workbox-expiration
     */

    class CacheExpiration {
      /**
       * To construct a new CacheExpiration instance you must provide at least
       * one of the `config` properties.
       *
       * @param {string} cacheName Name of the cache to apply restrictions to.
       * @param {Object} config
       * @param {number} [config.maxEntries] The maximum number of entries to cache.
       * Entries used the least will be removed as the maximum is reached.
       * @param {number} [config.maxAgeSeconds] The maximum age of an entry before
       * it's treated as stale and removed.
       */
      constructor(cacheName, config = {}) {
        this._isRunning = false;
        this._rerunRequested = false;

        {
          assert_js.assert.isType(cacheName, 'string', {
            moduleName: 'workbox-expiration',
            className: 'CacheExpiration',
            funcName: 'constructor',
            paramName: 'cacheName'
          });

          if (!(config.maxEntries || config.maxAgeSeconds)) {
            throw new WorkboxError_js.WorkboxError('max-entries-or-age-required', {
              moduleName: 'workbox-expiration',
              className: 'CacheExpiration',
              funcName: 'constructor'
            });
          }

          if (config.maxEntries) {
            assert_js.assert.isType(config.maxEntries, 'number', {
              moduleName: 'workbox-expiration',
              className: 'CacheExpiration',
              funcName: 'constructor',
              paramName: 'config.maxEntries'
            }); // TODO: Assert is positive
          }

          if (config.maxAgeSeconds) {
            assert_js.assert.isType(config.maxAgeSeconds, 'number', {
              moduleName: 'workbox-expiration',
              className: 'CacheExpiration',
              funcName: 'constructor',
              paramName: 'config.maxAgeSeconds'
            }); // TODO: Assert is positive
          }
        }

        this._maxEntries = config.maxEntries;
        this._maxAgeSeconds = config.maxAgeSeconds;
        this._cacheName = cacheName;
        this._timestampModel = new CacheTimestampsModel(cacheName);
      }
      /**
       * Expires entries for the given cache and given criteria.
       */


      async expireEntries() {
        if (this._isRunning) {
          this._rerunRequested = true;
          return;
        }

        this._isRunning = true;
        const minTimestamp = this._maxAgeSeconds ? Date.now() - this._maxAgeSeconds * 1000 : 0;
        const urlsExpired = await this._timestampModel.expireEntries(minTimestamp, this._maxEntries); // Delete URLs from the cache

        const cache = await self.caches.open(this._cacheName);

        for (const url of urlsExpired) {
          await cache.delete(url);
        }

        {
          if (urlsExpired.length > 0) {
            logger_js.logger.groupCollapsed(`Expired ${urlsExpired.length} ` + `${urlsExpired.length === 1 ? 'entry' : 'entries'} and removed ` + `${urlsExpired.length === 1 ? 'it' : 'them'} from the ` + `'${this._cacheName}' cache.`);
            logger_js.logger.log(`Expired the following ${urlsExpired.length === 1 ? 'URL' : 'URLs'}:`);
            urlsExpired.forEach(url => logger_js.logger.log(`    ${url}`));
            logger_js.logger.groupEnd();
          } else {
            logger_js.logger.debug(`Cache expiration ran and found no entries to remove.`);
          }
        }

        this._isRunning = false;

        if (this._rerunRequested) {
          this._rerunRequested = false;
          dontWaitFor_js.dontWaitFor(this.expireEntries());
        }
      }
      /**
       * Update the timestamp for the given URL. This ensures the when
       * removing entries based on maximum entries, most recently used
       * is accurate or when expiring, the timestamp is up-to-date.
       *
       * @param {string} url
       */


      async updateTimestamp(url) {
        {
          assert_js.assert.isType(url, 'string', {
            moduleName: 'workbox-expiration',
            className: 'CacheExpiration',
            funcName: 'updateTimestamp',
            paramName: 'url'
          });
        }

        await this._timestampModel.setTimestamp(url, Date.now());
      }
      /**
       * Can be used to check if a URL has expired or not before it's used.
       *
       * This requires a look up from IndexedDB, so can be slow.
       *
       * Note: This method will not remove the cached entry, call
       * `expireEntries()` to remove indexedDB and Cache entries.
       *
       * @param {string} url
       * @return {boolean}
       */


      async isURLExpired(url) {
        if (!this._maxAgeSeconds) {
          {
            throw new WorkboxError_js.WorkboxError(`expired-test-without-max-age`, {
              methodName: 'isURLExpired',
              paramName: 'maxAgeSeconds'
            });
          }
        } else {
          const timestamp = await this._timestampModel.getTimestamp(url);
          const expireOlderThan = Date.now() - this._maxAgeSeconds * 1000;
          return timestamp < expireOlderThan;
        }
      }
      /**
       * Removes the IndexedDB object store used to keep track of cache expiration
       * metadata.
       */


      async delete() {
        // Make sure we don't attempt another rerun if we're called in the middle of
        // a cache expiration.
        this._rerunRequested = false;
        await this._timestampModel.expireEntries(Infinity); // Expires all.
      }

    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * This plugin can be used in the Workbox APIs to regularly enforce a
     * limit on the age and / or the number of cached requests.
     *
     * Whenever a cached request is used or updated, this plugin will look
     * at the used Cache and remove any old or extra requests.
     *
     * When using `maxAgeSeconds`, requests may be used *once* after expiring
     * because the expiration clean up will not have occurred until *after* the
     * cached request has been used. If the request has a "Date" header, then
     * a light weight expiration check is performed and the request will not be
     * used immediately.
     *
     * When using `maxEntries`, the entry least-recently requested will be removed
     * from the cache first.
     *
     * @memberof module:workbox-expiration
     */

    class ExpirationPlugin {
      /**
       * @param {Object} config
       * @param {number} [config.maxEntries] The maximum number of entries to cache.
       * Entries used the least will be removed as the maximum is reached.
       * @param {number} [config.maxAgeSeconds] The maximum age of an entry before
       * it's treated as stale and removed.
       * @param {boolean} [config.purgeOnQuotaError] Whether to opt this cache in to
       * automatic deletion if the available storage quota has been exceeded.
       */
      constructor(config = {}) {
        /**
         * A "lifecycle" callback that will be triggered automatically by the
         * `workbox-strategies` handlers when a `Response` is about to be returned
         * from a [Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache) to
         * the handler. It allows the `Response` to be inspected for freshness and
         * prevents it from being used if the `Response`'s `Date` header value is
         * older than the configured `maxAgeSeconds`.
         *
         * @param {Object} options
         * @param {string} options.cacheName Name of the cache the response is in.
         * @param {Response} options.cachedResponse The `Response` object that's been
         *     read from a cache and whose freshness should be checked.
         * @return {Response} Either the `cachedResponse`, if it's
         *     fresh, or `null` if the `Response` is older than `maxAgeSeconds`.
         *
         * @private
         */
        this.cachedResponseWillBeUsed = async ({
          event,
          request,
          cacheName,
          cachedResponse
        }) => {
          if (!cachedResponse) {
            return null;
          }

          const isFresh = this._isResponseDateFresh(cachedResponse); // Expire entries to ensure that even if the expiration date has
          // expired, it'll only be used once.


          const cacheExpiration = this._getCacheExpiration(cacheName);

          dontWaitFor_js.dontWaitFor(cacheExpiration.expireEntries()); // Update the metadata for the request URL to the current timestamp,
          // but don't `await` it as we don't want to block the response.

          const updateTimestampDone = cacheExpiration.updateTimestamp(request.url);

          if (event) {
            try {
              event.waitUntil(updateTimestampDone);
            } catch (error) {
              {
                // The event may not be a fetch event; only log the URL if it is.
                if ('request' in event) {
                  logger_js.logger.warn(`Unable to ensure service worker stays alive when ` + `updating cache entry for ` + `'${getFriendlyURL_js.getFriendlyURL(event.request.url)}'.`);
                }
              }
            }
          }

          return isFresh ? cachedResponse : null;
        };
        /**
         * A "lifecycle" callback that will be triggered automatically by the
         * `workbox-strategies` handlers when an entry is added to a cache.
         *
         * @param {Object} options
         * @param {string} options.cacheName Name of the cache that was updated.
         * @param {string} options.request The Request for the cached entry.
         *
         * @private
         */


        this.cacheDidUpdate = async ({
          cacheName,
          request
        }) => {
          {
            assert_js.assert.isType(cacheName, 'string', {
              moduleName: 'workbox-expiration',
              className: 'Plugin',
              funcName: 'cacheDidUpdate',
              paramName: 'cacheName'
            });
            assert_js.assert.isInstance(request, Request, {
              moduleName: 'workbox-expiration',
              className: 'Plugin',
              funcName: 'cacheDidUpdate',
              paramName: 'request'
            });
          }

          const cacheExpiration = this._getCacheExpiration(cacheName);

          await cacheExpiration.updateTimestamp(request.url);
          await cacheExpiration.expireEntries();
        };

        {
          if (!(config.maxEntries || config.maxAgeSeconds)) {
            throw new WorkboxError_js.WorkboxError('max-entries-or-age-required', {
              moduleName: 'workbox-expiration',
              className: 'Plugin',
              funcName: 'constructor'
            });
          }

          if (config.maxEntries) {
            assert_js.assert.isType(config.maxEntries, 'number', {
              moduleName: 'workbox-expiration',
              className: 'Plugin',
              funcName: 'constructor',
              paramName: 'config.maxEntries'
            });
          }

          if (config.maxAgeSeconds) {
            assert_js.assert.isType(config.maxAgeSeconds, 'number', {
              moduleName: 'workbox-expiration',
              className: 'Plugin',
              funcName: 'constructor',
              paramName: 'config.maxAgeSeconds'
            });
          }
        }

        this._config = config;
        this._maxAgeSeconds = config.maxAgeSeconds;
        this._cacheExpirations = new Map();

        if (config.purgeOnQuotaError) {
          registerQuotaErrorCallback_js.registerQuotaErrorCallback(() => this.deleteCacheAndMetadata());
        }
      }
      /**
       * A simple helper method to return a CacheExpiration instance for a given
       * cache name.
       *
       * @param {string} cacheName
       * @return {CacheExpiration}
       *
       * @private
       */


      _getCacheExpiration(cacheName) {
        if (cacheName === cacheNames_js.cacheNames.getRuntimeName()) {
          throw new WorkboxError_js.WorkboxError('expire-custom-caches-only');
        }

        let cacheExpiration = this._cacheExpirations.get(cacheName);

        if (!cacheExpiration) {
          cacheExpiration = new CacheExpiration(cacheName, this._config);

          this._cacheExpirations.set(cacheName, cacheExpiration);
        }

        return cacheExpiration;
      }
      /**
       * @param {Response} cachedResponse
       * @return {boolean}
       *
       * @private
       */


      _isResponseDateFresh(cachedResponse) {
        if (!this._maxAgeSeconds) {
          // We aren't expiring by age, so return true, it's fresh
          return true;
        } // Check if the 'date' header will suffice a quick expiration check.
        // See https://github.com/GoogleChromeLabs/sw-toolbox/issues/164 for
        // discussion.


        const dateHeaderTimestamp = this._getDateHeaderTimestamp(cachedResponse);

        if (dateHeaderTimestamp === null) {
          // Unable to parse date, so assume it's fresh.
          return true;
        } // If we have a valid headerTime, then our response is fresh iff the
        // headerTime plus maxAgeSeconds is greater than the current time.


        const now = Date.now();
        return dateHeaderTimestamp >= now - this._maxAgeSeconds * 1000;
      }
      /**
       * This method will extract the data header and parse it into a useful
       * value.
       *
       * @param {Response} cachedResponse
       * @return {number|null}
       *
       * @private
       */


      _getDateHeaderTimestamp(cachedResponse) {
        if (!cachedResponse.headers.has('date')) {
          return null;
        }

        const dateHeader = cachedResponse.headers.get('date');
        const parsedDate = new Date(dateHeader);
        const headerTime = parsedDate.getTime(); // If the Date header was invalid for some reason, parsedDate.getTime()
        // will return NaN.

        if (isNaN(headerTime)) {
          return null;
        }

        return headerTime;
      }
      /**
       * This is a helper method that performs two operations:
       *
       * - Deletes *all* the underlying Cache instances associated with this plugin
       * instance, by calling caches.delete() on your behalf.
       * - Deletes the metadata from IndexedDB used to keep track of expiration
       * details for each Cache instance.
       *
       * When using cache expiration, calling this method is preferable to calling
       * `caches.delete()` directly, since this will ensure that the IndexedDB
       * metadata is also cleanly removed and open IndexedDB instances are deleted.
       *
       * Note that if you're *not* using cache expiration for a given cache, calling
       * `caches.delete()` and passing in the cache's name should be sufficient.
       * There is no Workbox-specific method needed for cleanup in that case.
       */


      async deleteCacheAndMetadata() {
        // Do this one at a time instead of all at once via `Promise.all()` to
        // reduce the chance of inconsistency if a promise rejects.
        for (const [cacheName, cacheExpiration] of this._cacheExpirations) {
          await self.caches.delete(cacheName);
          await cacheExpiration.delete();
        } // Reset this._cacheExpirations to its initial state.


        this._cacheExpirations = new Map();
      }

    }

    exports.CacheExpiration = CacheExpiration;
    exports.ExpirationPlugin = ExpirationPlugin;

    return exports;

}({}, workbox.core._private, workbox.core._private, workbox.core._private, workbox.core._private, workbox.core._private, workbox.core._private, workbox.core._private, workbox.core._private, workbox.core));
//# sourceMappingURL=workbox-expiration.dev.js.map
