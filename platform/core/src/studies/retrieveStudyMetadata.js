import RetrieveMetadata from './services/wado/retrieveMetadata.js';

const moduleName = 'RetrieveStudyMetadata';
// Cache for promises. Prevents unnecessary subsequent calls to the server
const StudyMetaDataPromises = new Map();

/**
 * Retrieves study metadata
 *
 * @param {Object} server Object with server configuration parameters
 * @param {string} StudyInstanceUID The UID of the Study to be retrieved
 * @param {Object} [filters] - Object containing filters to be applied on retrieve metadata process
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @param {boolean} [separateSeriesInstanceUIDFilters = false] - If true, split filtered metadata calls into multiple calls,
 * as some DICOMWeb implementations only support single filters.
 * @returns {Promise} that will be resolved with the metadata or rejected with the error
 */
export function retrieveStudyMetadata(
  server,
  StudyInstanceUID,
  filters,
  separateSeriesInstanceUIDFilters = false
) {
  // @TODO: Whenever a study metadata request has failed, its related promise will be rejected once and for all
  // and further requests for that metadata will always fail. On failure, we probably need to remove the
  // corresponding promise from the "StudyMetaDataPromises" map...

  if (!server) {
    throw new Error(`${moduleName}: Required 'server' parameter not provided.`);
  }
  if (!StudyInstanceUID) {
    throw new Error(
      `${moduleName}: Required 'StudyInstanceUID' parameter not provided.`
    );
  }

  // Already waiting on result? Return cached promise
  if (StudyMetaDataPromises.has(StudyInstanceUID)) {
    return StudyMetaDataPromises.get(StudyInstanceUID);
  }

  // Create a promise to handle the data retrieval
  let promise;

  if (
    filters &&
    filters.seriesInstanceUID &&
    separateSeriesInstanceUIDFilters
  ) {
    promise = __separateSeriesRequestToAggregatePromiseateSeriesRequestToAggregatePromise(
      server,
      StudyInstanceUID,
      filters
    );
  } else {
    promise = RetrieveMetadata(server, StudyInstanceUID, filters);

    /*
    promise = new Promise((resolve, reject) => {
      RetrieveMetadata(server, StudyInstanceUID, filters).then(function(data) {
        resolve(data);
      }, reject);
    });
    */
  }

  // Store the promise in cache
  StudyMetaDataPromises.set(StudyInstanceUID, promise);

  return promise;
}

/**
 * Splits up seriesInstanceUID filters to multiple calls for platforms
 * @param {Object} server Object with server configuration parameters
 * @param {string} StudyInstanceUID The UID of the Study to be retrieved
 * @param {Object} filters - Object containing filters to be applied on retrieve metadata process
 */
function __separateSeriesRequestToAggregatePromiseateSeriesRequestToAggregatePromise(
  server,
  StudyInstanceUID,
  filters
) {
  const { seriesInstanceUID } = filters;
  const seriesInstanceUIDs = seriesInstanceUID.split(',');

  return new Promise((resolve, reject) => {
    const promises = [];

    seriesInstanceUIDs.forEach(uid => {
      const seriesSpecificFilters = Object.assign({}, filters, {
        seriesInstanceUID: uid,
      });

      promises.push(
        RetrieveMetadata(server, StudyInstanceUID, seriesSpecificFilters)
      );
    });

    Promise.all(promises).then(results => {
      const data = results[0];

      let series = [];

      results.forEach(result => {
        series = [...series, ...result.series];
      });

      data.series = series;

      resolve(data);
    }, reject);
  });
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
