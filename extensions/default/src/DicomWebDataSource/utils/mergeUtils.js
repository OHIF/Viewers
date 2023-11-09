import mergeResults from './mergeResults';

const STUDY_INSTANCE_UID = '0020000D';
const SERIES_INSTANCE_UID = '0020000E';

/**
 * Concatenates series metadata from all servers.
 * 
 * @param {Object} properties
 * @param {Array} properties.clients Client instances
 * @param {Object} properties.origParams Params
 * @param {Function} properties.mapParams Util function
 * @param {Function} properties.qidoSearch Util function
 * @returns {Promise<Array>} merged results
 */
export const multipleSearch = async ({ clients, origParams, mapParams, qidoSearch }) => {
  const clientResultsPromises = clients.map(client => {
    const { studyInstanceUid, seriesInstanceUid, ...mappedParams } =
      mapParams(origParams, {
        supportsFuzzyMatching: client.supportsFuzzyMatching,
        supportsWildcard: client.supportsWildcard,
      }) || {};
    let clientResults;
    try {
      clientResults = qidoSearch(client.qidoDicomWebClient, undefined, undefined, mappedParams);
    } catch {
      clientResults = [];
    }
    return clientResults;
  });
  const settledResults = await Promise.allSettled(clientResultsPromises);
  return mergeResults(settledResults, STUDY_INSTANCE_UID);
};

/**
 * Concatenate series metadata from all servers.
 * 
 * @param {Object} properties
 * @param {Array} properties.clients Client instances
 * @param {Function} properties.seriesInStudy Util function
 * @param {String} properties.studyInstanceUid Series instance uid
 * @returns {Promise<Array>} merged results
 */
export const multipleSeriesSearch = async ({ clients, seriesInStudy, studyInstanceUid }) => {
  const clientResultsPromises = clients.map(client => {
    let clientResults;
    try {
      clientResults = seriesInStudy(client.qidoDicomWebClient, studyInstanceUid);
    } catch {
      clientResults = [];
    }
    return clientResults;
  });
  const settledResults = await Promise.allSettled(clientResultsPromises);
  return mergeResults(settledResults, SERIES_INSTANCE_UID);
};

export default {
  multipleSearch,
  multipleSeriesSearch,
};
