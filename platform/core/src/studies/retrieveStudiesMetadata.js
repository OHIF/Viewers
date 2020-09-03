import log from '../log.js';
import { retrieveStudyMetadata } from './retrieveStudyMetadata';

/**
 * Retrieves metaData for multiple studies at once.
 *
 * This function calls retrieveStudyMetadata several times, asynchronously,
 * and waits for all of the results to be returned.
 *
 * @param {Object} server Object with server configuration parameters
 * @param {Array} studyInstanceUIDs The UIDs of the Studies to be retrieved
 * @param {Object} [filters] - Object containing filters to be applied on retrieve metadata process
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @param {boolean} [separateSeriesInstanceUIDFilters = false] - If true, split filtered metadata calls into multiple calls,
 * as some DICOMWeb implementations only support single filters.
 * @returns {Promise} that will be resolved with the metadata or rejected with the error
 */
export default function retrieveStudiesMetadata(
  server,
  studyInstanceUIDs,
  filters,
  separateSeriesInstanceUIDFilters = false
) {
  // Create an empty array to store the Promises for each metaData retrieval call
  const promises = [];

  // Loop through the array of studyInstanceUIDs
  studyInstanceUIDs.forEach(function(StudyInstanceUID) {
    // Send the call and resolve or reject the related promise based on its outcome
    const promise = retrieveStudyMetadata(
      server,
      StudyInstanceUID,
      filters,
      separateSeriesInstanceUIDFilters
    );

    // Add the current promise to the array of promises
    promises.push(promise);
  });

  // When all of the promises are complete, this callback runs
  const promise = Promise.all(promises);

  // Warn the error on console if some retrieval failed
  promise.catch(error => log.warn(error));

  return promise;
}
