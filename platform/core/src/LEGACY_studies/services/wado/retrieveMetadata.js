import RetrieveMetadataLoaderSync from './retrieveMetadataLoaderSync';
import RetrieveMetadataLoaderAsync from './retrieveMetadataLoaderAsync';

/**
 * Retrieve Study metadata from a DICOM server. If the server is configured to use lazy load, only the first series
 * will be loaded and the property "studyLoader" will be set to let consumer load remaining series as needed.
 *
 * @param {Object} server Object with server configuration parameters
 * @param {string} StudyInstanceUID The Study Instance UID of the study which needs to be loaded
 * @param {Object} [filters] - Object containing filters to be applied on retrieve metadata process
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @returns {Object} A study descriptor object
 */
async function RetrieveMetadata(server, StudyInstanceUID, filters = {}) {
  const RetrieveMetadataLoader =
    server.enableStudyLazyLoad != false
      ? RetrieveMetadataLoaderAsync
      : RetrieveMetadataLoaderSync;

  const retrieveMetadataLoader = new RetrieveMetadataLoader(
    server,
    StudyInstanceUID,
    filters
  );
  const studyMetadata = retrieveMetadataLoader.execLoad();

  return studyMetadata;
}

export default RetrieveMetadata;
