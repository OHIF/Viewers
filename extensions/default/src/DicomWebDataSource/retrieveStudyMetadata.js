import retrieveMetadataFiltered from './utils/retrieveMetadataFiltered.js';
import RetrieveMetadata from './wado/retrieveMetadata.js';

const moduleName = 'RetrieveStudyMetadata';
// Cache for promises. Prevents unnecessary subsequent calls to the server
const StudyMetaDataPromises = new Map();

/**
 * Retrieves study metadata.
 *
 * @param {Object} dicomWebClient The DICOMWebClient instance to be used for series load
 * @param {string} StudyInstanceUID The UID of the Study to be retrieved
 * @param {boolean} enableStudyLazyLoad Whether the study metadata should be loaded asynchronously.
 * @param {Object} [filters] Object containing filters to be applied on retrieve metadata process
 * @param {string} [filters.seriesInstanceUID] Series instance uid to filter results against
 * @param {function} [sortCriteria] Sort criteria function
 * @param {function} [sortFunction] Sort function
 *
 * @returns {Promise} that will be resolved with the metadata or rejected with the error
 */
export function retrieveStudyMetadata(
  dicomWebClient,
  StudyInstanceUID,
  enableStudyLazyLoad,
  filters,
  sortCriteria,
  sortFunction,
  dicomWebConfig = {}
) {
  // @TODO: Whenever a study metadata request has failed, its related promise will be rejected once and for all
  // and further requests for that metadata will always fail. On failure, we probably need to remove the
  // corresponding promise from the "StudyMetaDataPromises" map...

  if (!dicomWebClient) {
    throw new Error(`${moduleName}: Required 'dicomWebClient' parameter not provided.`);
  }
  if (!StudyInstanceUID) {
    throw new Error(`${moduleName}: Required 'StudyInstanceUID' parameter not provided.`);
  }

  const promiseId = `${dicomWebConfig.name}:${StudyInstanceUID}`;

  // Already waiting on result? Return cached promise
  if (StudyMetaDataPromises.has(promiseId)) {
    return StudyMetaDataPromises.get(promiseId);
  }

  let promise;

  if (filters && filters.seriesInstanceUID && Array.isArray(filters.seriesInstanceUID)) {
    promise = retrieveMetadataFiltered(
      dicomWebClient,
      StudyInstanceUID,
      enableStudyLazyLoad,
      filters,
      sortCriteria,
      sortFunction
    );
  } else {
    // Create a promise to handle the data retrieval
    promise = new Promise((resolve, reject) => {
      RetrieveMetadata(
        dicomWebClient,
        StudyInstanceUID,
        enableStudyLazyLoad,
        filters,
        sortCriteria,
        sortFunction
      ).then(function (data) {
        resolve(data);
      }, reject);
    });
  }

  // Store the promise in cache
  StudyMetaDataPromises.set(promiseId, promise);

  return promise;
}

/**
 * Delete the cached study metadata retrieval promise to ensure that the browser will
 * re-retrieve the study metadata when it is next requested.
 *
 * Promises are cached under `<data source name>:<StudyInstanceUID>` (see above),
 * but every caller knows only the study — a data source exports this function
 * directly, unbound, and the callers that matter (storing a derived artifact, and
 * the microscopy save) hold a study UID and nothing else. Looking the bare UID up
 * as a key therefore never matched, and this function had never removed anything:
 * any re-retrieve after a store returned the promise resolved *before* it. Match
 * on the study instead, across whichever data sources have cached it.
 *
 * @param {String} StudyInstanceUID The UID of the Study to be removed from cache
 */
export function deleteStudyMetadataPromise(StudyInstanceUID) {
  if (!StudyInstanceUID) {
    return;
  }

  const suffix = `:${StudyInstanceUID}`;

  for (const promiseId of [...StudyMetaDataPromises.keys()]) {
    if (promiseId === StudyInstanceUID || promiseId.endsWith(suffix)) {
      StudyMetaDataPromises.delete(promiseId);
    }
  }
}

/** Test seam: the cached promises, so a test can assert what invalidation removed. */
export function _getStudyMetadataPromiseCache() {
  return StudyMetaDataPromises;
}
