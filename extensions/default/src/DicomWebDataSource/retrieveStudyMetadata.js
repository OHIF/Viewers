import RetrieveMetadata from './wado/retrieveMetadata.js';

const moduleName = 'RetrieveStudyMetadata';
// Cache for promises. Prevents unnecessary subsequent calls to the server
const StudyMetaDataPromises = new Map();

/**
 * Retrieves study metadata
 *
 * @param {Object} dicomWebClient Object with server configuration parameters
 * @param {string} StudyInstanceUID The UID of the Study to be retrieved
 * @param {boolean} enabledStudyLazyLoad Whether the study metadata should be loaded asynchronously.
 * @param {Object} [filters] - Object containing filters to be applied on retrieve metadata process
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @param {Object} sortCriteria - defines the sort criteria for series
 * @param {function} sortFunction - defines a function to sort series. If defined, it has precedence over sortCriteria param
 * @returns {Promise} that will be resolved with the metadata or rejected with the error
 */
export function retrieveStudyMetadata(
  dicomWebClient,
  StudyInstanceUID,
  enableStudyLazyLoad,
  filters,
  sortCriteria,
  sortFunction
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

  // Already waiting on result? Return cached promise. The StudyMetaDataPromises
  // key is a combination of the client name and StudyInstanceUID, because OHIF
  // has the capability to retrieve series from the same study from different DICOM web servers.
  const studyRetrieveId = `${dicomWebClient.name}/${StudyInstanceUID}`;
  if (StudyMetaDataPromises.has(studyRetrieveId)) {
    return StudyMetaDataPromises.get(studyRetrieveId);
  }

  // Create a promise to handle the data retrieval
  const promise = new Promise((resolve, reject) => {
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

  // Store the promise in cache
  StudyMetaDataPromises.set(studyRetrieveId, promise);

  return promise;
}

/**
 * Delete the cached study metadata retrieval promise to ensure that the browser will
 * re-retrieve the study metadata when it is next requested
 *
 * @param {String} StudyInstanceUID The UID of the Study to be removed from cache
 *
 */
export function deleteStudyMetadataPromise(StudyInstanceUID) {
  if (StudyMetaDataPromises.has(StudyInstanceUID)) {
    StudyMetaDataPromises.delete(StudyInstanceUID);
  }
}
