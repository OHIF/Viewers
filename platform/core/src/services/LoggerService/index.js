const name = 'LoggerService';

const publicAPI = {
  name,
  info: _info,
  error: _error,
  setServiceImplementation,
};

const serviceImplementation = {
  _info: () => console.warn('info() NOT IMPLEMENTED'),
  _error: () => console.warn('error() NOT IMPLEMENTED'),
};

/**
 * Logs an info
 *
 * @param {object} props { message, displayOnConsole }
 */
function _info({ message, displayOnConsole }) {
  return serviceImplementation._info({
    message,
    displayOnConsole,
  });
}

/**
 * Logs an error
 *
 * @param {object} props { error, stack, message, displayOnConsole }
 * @returns void
 */
function _error({ error, stack, message, displayOnConsole }) {
  return serviceImplementation._error({
    error,
    stack,
    message,
    displayOnConsole,
  });
}

/**
 *
 *
 * @param {*} {
 *   info: infoImplementation,
 *   error: errorImplementation,
 * }
 */
function setServiceImplementation({
  info: infoImplementation,
  error: errorImplementation,
}) {
  if (infoImplementation) {
    serviceImplementation._info = infoImplementation;
  }
  if (errorImplementation) {
    serviceImplementation._error = errorImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
