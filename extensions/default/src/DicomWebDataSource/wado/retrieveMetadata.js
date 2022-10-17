import RetrieveMetadataLoaderSync from './retrieveMetadataLoaderSync';
import RetrieveMetadataLoaderAsync from './retrieveMetadataLoaderAsync';

/**
 * Retrieve Study metadata from a DICOM server. If the server is configured to use lazy load, only the first series
 * will be loaded and the property "studyLoader" will be set to let consumer load remaining series as needed.
 *
 * @param {Object} dicomWebClient The dicomweb-client.
 * @param {string} studyInstanceUid The Study Instance UID of the study which needs to be loaded
 * @param {Object} [filters] - Object containing filters to be applied on retrieve metadata process
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @returns {Object} A study descriptor object
 */
async function RetrieveMetadata(
  dicomWebClient,
  studyInstanceUid,
  enableStudyLazyLoad,
  filters = {},
  sortCriteria,
  sortFunction
) {
  const RetrieveMetadataLoader =
    enableStudyLazyLoad !== false
      ? RetrieveMetadataLoaderAsync
      : RetrieveMetadataLoaderSync;

  const retrieveMetadataLoader = new RetrieveMetadataLoader(
    dicomWebClient,
    studyInstanceUid,
    filters,
    sortCriteria,
    sortFunction
  );
  const data = await retrieveMetadataLoader.execLoad();

  return data;
}

export default RetrieveMetadata;
