import Studies from './services/qido/studies';

const studySearchPromises = new Map();

/**
 * Search for studies information by the given filter
 *
 * @param {Object} filter Filter that will be used on search
 * @returns {Promise} resolved with an array of studies information or rejected with an error
 */
export default function searchStudies(server, filter) {
  const promiseKeyObj = {
    qidoRoot: server.qidoRoot,
    filter,
  };
  const promiseKey = JSON.stringify(promiseKeyObj);
  if (studySearchPromises.has(promiseKey)) {
    return studySearchPromises.get(promiseKey);
  } else {
    const promise = Studies(server, filter);

    studySearchPromises.set(promiseKey, promise);

    return promise;
  }
}
