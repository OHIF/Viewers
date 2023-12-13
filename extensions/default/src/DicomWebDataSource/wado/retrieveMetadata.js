import RetrieveMetadataLoaderSync from './retrieveMetadataLoaderSync';
import RetrieveMetadataLoaderAsync from './retrieveMetadataLoaderAsync';

/**
 * Retrieve Study metadata from a DICOM server. If the server is configured to use lazy load, only the first series
 * will be loaded and the property "studyLoader" will be set to let consumer load remaining series as needed.
 *
 * @param {*} dicomWebClient The DICOMWebClient instance to be used for series load
 * @param {*} StudyInstanceUID The UID of the Study to be retrieved
 * @param {*} enableStudyLazyLoad Whether the study metadata should be loaded asynchronously
 * @param {object} filters Object containing filters to be applied on retrieve metadata process
 * @param {string} [filters.seriesInstanceUID] Series instance uid to filter results against
 * @param {array} [filters.SeriesInstanceUIDs] Series instance uids to filter results against
 * @param {function} [sortCriteria] Sort criteria function
 * @param {function} [sortFunction] Sort function
 *
 * @returns {Promise} A promises that resolves the study descriptor object
 */
async function RetrieveMetadata(
  dicomWebClient,
  StudyInstanceUID,
  enableStudyLazyLoad,
  filters = {},
  sortCriteria,
  sortFunction
) {
  const RetrieveMetadataLoader =
    enableStudyLazyLoad !== false ? RetrieveMetadataLoaderAsync : RetrieveMetadataLoaderSync;

  const retrieveMetadataLoader = new RetrieveMetadataLoader(
    dicomWebClient,
    StudyInstanceUID,
    filters,
    sortCriteria,
    sortFunction
  );
  const data = await retrieveMetadataLoader.execLoad();

  return data;
}

export default RetrieveMetadata;
