import retry from 'retry';

const defaultRetryOptions = {
  retries: 5,
  factor: 3,
  minTimeout: 1 * 1000,
  maxTimeout: 60 * 1000,
  randomize: true,
  retryableStatusCodes: [429, 500],
};

let retryOptions = { ...defaultRetryOptions };

/**
 * Request hook used to add retry functionality to XHR requests.
 *
 * @param {XMLHttpRequest} request XHR request instance
 * @param {object} metadata Metadata about the request
 * @param {object} metadata.url URL
 * @param {object} metadata.method HTTP method
 * @returns {XMLHttpRequest} request instance optionally modified
 */
const xhrRetryRequestHook = (request, metadata) => {
  const { url, method } = metadata;

  function faultTolerantRequestSend(...args) {
    const operation = retry.operation(retryOptions);

    operation.attempt(function operationAttempt(currentAttempt) {
      const originalOnReadyStateChange = request.onreadystatechange;

      /** Overriding/extending XHR function */
      request.onreadystatechange = function onReadyStateChange() {
        originalOnReadyStateChange.call(request);

        if (retryOptions.retryableStatusCodes.includes(request.status)) {
          const errorMessage = `Attempt to request ${url} failed.`;
          const attemptFailedError = new Error(errorMessage);
          operation.retry(attemptFailedError);
        }
      };

      console.warn(`Requesting ${url}... (attempt: ${currentAttempt})`);
      request.open(method, url, true);
      originalRequestSend.call(request, ...args);
    });
  }

  /** Overriding/extending XHR function */
  const originalRequestSend = request.send;
  request.send = faultTolerantRequestSend;

  return request;
};

/**
 * Returns a configured retry request hook function
 * that can be used to add retry functionality to XHR request.
 *
 * Default options:
 *   retries: 5
 *   factor: 3
 *   minTimeout: 1 * 1000
 *   maxTimeout: 60 * 1000
 *   randomize: true
 *
 * @param {object} options
 * @param {number} options.retires number of retries
 * @param {number} options.factor factor
 * @param {number} options.minTimeout the min timeout
 * @param {number} options.maxTimeout the max timeout
 * @param {boolean} options.randomize randomize
 * @param {array} options.retryableStatusCodes status codes that can trigger retry
 * @returns {function} the configured retry request function
 */
export const getXHRRetryRequestHook = (options = {}) => {
  retryOptions = { ...defaultRetryOptions };
  if ('retries' in options) {
    retryOptions.retries = options.retries;
  }
  if ('factor' in options) {
    retryOptions.factor = options.factor;
  }
  if ('minTimeout' in options) {
    retryOptions.minTimeout = options.minTimeout;
  }
  if ('maxTimeout' in options) {
    retryOptions.maxTimeout = options.maxTimeout;
  }
  if ('randomize' in options) {
    retryOptions.randomize = options.randomize;
  }
  return xhrRetryRequestHook;
};

export default getXHRRetryRequestHook;
