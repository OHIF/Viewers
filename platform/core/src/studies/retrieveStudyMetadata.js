import RetrieveMetadata from './services/wado/retrieveMetadata.js';

const moduleName = 'RetrieveStudyMetadata';
// Cache for promises. Prevents unnecessary subsequent calls to the server
const StudyMetaDataPromises = new Map();

/**
 * Retrieves study metadata
 *
 * @param {Object} server Object with server configuration parameters
 * @param {string} studyInstanceUid The UID of the Study to be retrieved
 * @param {Object} [filters] - Object containing filters to be applied on retrieve metadata process
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @returns {Promise} that will be resolved with the metadata or rejected with the error
 */
export function retrieveStudyMetadata(server, studyInstanceUid, filters) {
  // @TODO: Whenever a study metadata request has failed, its related promise will be rejected once and for all
  // and further requests for that metadata will always fail. On failure, we probably need to remove the
  // corresponding promise from the "StudyMetaDataPromises" map...

  if (!server) {
    throw new Error(`${moduleName}: Required 'server' parameter not provided.`);
  }
  if (!studyInstanceUid) {
    throw new Error(
      `${moduleName}: Required 'studyInstanceUid' parameter not provided.`
    );
  }

  // Already waiting on result? Return cached promise
  if (StudyMetaDataPromises.has(studyInstanceUid)) {
    return StudyMetaDataPromises.get(studyInstanceUid);
  }

  // Create a promise to handle the data retrieval
  const promise = new Promise((resolve, reject) => {
    RetrieveMetadata(server, studyInstanceUid, filters).then(function(data) {
      resolve(data);
    }, reject);
  });

  // Store the promise in cache
  StudyMetaDataPromises.set(studyInstanceUid, promise);

  return promise;
}

/**
 * Delete the cached study metadata retrieval promise to ensure that the browser will
 * re-retrieve the study metadata when it is next requested
 *
 * @param {String} studyInstanceUid The UID of the Study to be removed from cache
 *
 */
export function deleteStudyMetadataPromise(studyInstanceUid) {
  if (StudyMetaDataPromises.has(studyInstanceUid)) {
    StudyMetaDataPromises.delete(studyInstanceUid);
  }
}
