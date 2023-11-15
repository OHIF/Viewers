import RetrieveMetadata from '../wado/retrieveMetadata';

/**
 * Retrieve metadata filtered.
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
 * @returns
 */
function retrieveMetadataFiltered(
  dicomWebClient,
  StudyInstanceUID,
  enableStudyLazyLoad,
  filters,
  sortCriteria,
  sortFunction
) {
  const { SeriesInstanceUIDs } = filters;

  return new Promise((resolve, reject) => {
    const promises = SeriesInstanceUIDs.map(uid => {
      const seriesSpecificFilters = Object.assign({}, filters, {
        seriesInstanceUID: uid,
      });

      return RetrieveMetadata(
        dicomWebClient,
        StudyInstanceUID,
        enableStudyLazyLoad,
        seriesSpecificFilters,
        sortCriteria,
        sortFunction
      );
    });

    Promise.all(promises).then(results => {
      const aggregatedResult = { preLoadData: [], promises: [] };

      results.forEach(({ preLoadData, promises }) => {
        aggregatedResult.preLoadData = aggregatedResult.preLoadData.concat(preLoadData);
        aggregatedResult.promises = aggregatedResult.promises.concat(promises);
      });

      resolve(aggregatedResult);
    }, reject);
  });
}

export default retrieveMetadataFiltered;
