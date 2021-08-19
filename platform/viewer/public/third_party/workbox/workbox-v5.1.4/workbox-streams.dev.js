this.workbox = this.workbox || {};
this.workbox.streams = (function (exports, logger_js, assert_js, Deferred_js, canConstructReadableStream_js) {
    'use strict';

    try {
      self['workbox:streams:5.1.4'] && _();
    } catch (e) {}

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Takes either a Response, a ReadableStream, or a
     * [BodyInit](https://fetch.spec.whatwg.org/#bodyinit) and returns the
     * ReadableStreamReader object associated with it.
     *
     * @param {module:workbox-streams.StreamSource} source
     * @return {ReadableStreamReader}
     * @private
     */

    function _getReaderFromSource(source) {
      if (source instanceof Response) {
        return source.body.getReader();
      }

      if (source instanceof ReadableStream) {
        return source.getReader();
      }

      return new Response(source).body.getReader();
    }
    /**
     * Takes multiple source Promises, each of which could resolve to a Response, a
     * ReadableStream, or a [BodyInit](https://fetch.spec.whatwg.org/#bodyinit).
     *
     * Returns an object exposing a ReadableStream with each individual stream's
     * data returned in sequence, along with a Promise which signals when the
     * stream is finished (useful for passing to a FetchEvent's waitUntil()).
     *
     * @param {Array<Promise<module:workbox-streams.StreamSource>>} sourcePromises
     * @return {Object<{done: Promise, stream: ReadableStream}>}
     *
     * @memberof module:workbox-streams
     */


    function concatenate(sourcePromises) {
      {
        assert_js.assert.isArray(sourcePromises, {
          moduleName: 'workbox-streams',
          funcName: 'concatenate',
          paramName: 'sourcePromises'
        });
      }

      const readerPromises = sourcePromises.map(sourcePromise => {
        return Promise.resolve(sourcePromise).then(source => {
          return _getReaderFromSource(source);
        });
      });
      const streamDeferred = new Deferred_js.Deferred();
      let i = 0;
      const logMessages = [];
      const stream = new ReadableStream({
        pull(controller) {
          return readerPromises[i].then(reader => reader.read()).then(result => {
            if (result.done) {
              {
                logMessages.push(['Reached the end of source:', sourcePromises[i]]);
              }

              i++;

              if (i >= readerPromises.length) {
                // Log all the messages in the group at once in a single group.
                {
                  logger_js.logger.groupCollapsed(`Concatenating ${readerPromises.length} sources.`);

                  for (const message of logMessages) {
                    if (Array.isArray(message)) {
                      logger_js.logger.log(...message);
                    } else {
                      logger_js.logger.log(message);
                    }
                  }

                  logger_js.logger.log('Finished reading all sources.');
                  logger_js.logger.groupEnd();
                }

                controller.close();
                streamDeferred.resolve();
                return;
              } // The `pull` method is defined because we're inside it.


              return this.pull(controller);
            } else {
              controller.enqueue(result.value);
            }
          }).catch(error => {
            {
              logger_js.logger.error('An error occurred:', error);
            }

            streamDeferred.reject(error);
            throw error;
          });
        },

        cancel() {
          {
            logger_js.logger.warn('The ReadableStream was cancelled.');
          }

          streamDeferred.resolve();
        }

      });
      return {
        done: streamDeferred.promise,
        stream
      };
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * This is a utility method that determines whether the current browser supports
     * the features required to create streamed responses. Currently, it checks if
     * [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/ReadableStream)
     * is available.
     *
     * @private
     * @param {HeadersInit} [headersInit] If there's no `Content-Type` specified,
     * `'text/html'` will be used by default.
     * @return {boolean} `true`, if the current browser meets the requirements for
     * streaming responses, and `false` otherwise.
     *
     * @memberof module:workbox-streams
     */

    function createHeaders(headersInit = {}) {
      // See https://github.com/GoogleChrome/workbox/issues/1461
      const headers = new Headers(headersInit);

      if (!headers.has('content-type')) {
        headers.set('content-type', 'text/html');
      }

      return headers;
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * Takes multiple source Promises, each of which could resolve to a Response, a
     * ReadableStream, or a [BodyInit](https://fetch.spec.whatwg.org/#bodyinit),
     * along with a
     * [HeadersInit](https://fetch.spec.whatwg.org/#typedefdef-headersinit).
     *
     * Returns an object exposing a Response whose body consists of each individual
     * stream's data returned in sequence, along with a Promise which signals when
     * the stream is finished (useful for passing to a FetchEvent's waitUntil()).
     *
     * @param {Array<Promise<module:workbox-streams.StreamSource>>} sourcePromises
     * @param {HeadersInit} [headersInit] If there's no `Content-Type` specified,
     * `'text/html'` will be used by default.
     * @return {Object<{done: Promise, response: Response}>}
     *
     * @memberof module:workbox-streams
     */

    function concatenateToResponse(sourcePromises, headersInit) {
      const {
        done,
        stream
      } = concatenate(sourcePromises);
      const headers = createHeaders(headersInit);
      const response = new Response(stream, {
        headers
      });
      return {
        done,
        response
      };
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * This is a utility method that determines whether the current browser supports
     * the features required to create streamed responses. Currently, it checks if
     * [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/ReadableStream)
     * can be created.
     *
     * @return {boolean} `true`, if the current browser meets the requirements for
     * streaming responses, and `false` otherwise.
     *
     * @memberof module:workbox-streams
     */

    function isSupported() {
      return canConstructReadableStream_js.canConstructReadableStream();
    }

    /*
      Copyright 2018 Google LLC

      Use of this source code is governed by an MIT-style
      license that can be found in the LICENSE file or at
      https://opensource.org/licenses/MIT.
    */
    /**
     * A shortcut to create a strategy that could be dropped-in to Workbox's router.
     *
     * On browsers that do not support constructing new `ReadableStream`s, this
     * strategy will automatically wait for all the `sourceFunctions` to complete,
     * and create a final response that concatenates their values together.
     *
     * @param {Array<function({event, request, url, params})>} sourceFunctions
     * An array of functions similar to {@link module:workbox-routing~handlerCallback}
     * but that instead return a {@link module:workbox-streams.StreamSource} (or a
     * Promise which resolves to one).
     * @param {HeadersInit} [headersInit] If there's no `Content-Type` specified,
     * `'text/html'` will be used by default.
     * @return {module:workbox-routing~handlerCallback}
     * @memberof module:workbox-streams
     */

    function strategy(sourceFunctions, headersInit) {
      return async ({
        event,
        request,
        url,
        params
      }) => {
        const sourcePromises = sourceFunctions.map(fn => {
          // Ensure the return value of the function is always a promise.
          return Promise.resolve(fn({
            event,
            request,
            url,
            params
          }));
        });

        if (isSupported()) {
          const {
            done,
            response
          } = concatenateToResponse(sourcePromises, headersInit);

          if (event) {
            event.waitUntil(done);
          }

          return response;
        }

        {
          logger_js.logger.log(`The current browser doesn't support creating response ` + `streams. Falling back to non-streaming response instead.`);
        } // Fallback to waiting for everything to finish, and concatenating the
        // responses.


        const blobPartsPromises = sourcePromises.map(async sourcePromise => {
          const source = await sourcePromise;

          if (source instanceof Response) {
            return source.blob();
          } else {
            // Technically, a `StreamSource` object can include any valid
            // `BodyInit` type, including `FormData` and `URLSearchParams`, which
            // cannot be passed to the Blob constructor directly, so we have to
            // convert them to actual Blobs first.
            return new Response(source).blob();
          }
        });
        const blobParts = await Promise.all(blobPartsPromises);
        const headers = createHeaders(headersInit); // Constructing a new Response from a Blob source is well-supported.
        // So is constructing a new Blob from multiple source Blobs or strings.

        return new Response(new Blob(blobParts), {
          headers
        });
      };
    }

    exports.concatenate = concatenate;
    exports.concatenateToResponse = concatenateToResponse;
    exports.isSupported = isSupported;
    exports.strategy = strategy;

    return exports;

}({}, workbox.core._private, workbox.core._private, workbox.core._private, workbox.core._private));
//# sourceMappingURL=workbox-streams.dev.js.map
