import dcmjs from 'dcmjs';
const { DicomMetaDictionary } = dcmjs.data;
const { naturalizeDataset } = DicomMetaDictionary;

import { retrieveStudyMetadata } from '../retrieveStudyMetadata';
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
export const mergedSearch = async ({ clients, origParams, mapParams, qidoSearch }) => {
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
export const mergedSeriesSearch = async ({ clients, seriesInStudy, studyInstanceUid }) => {
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

/**
 * Search and retrieve in all servers.
 */
export const retrieveMergedSeriesMetadata = async ({
  clients,
  StudyInstanceUID,
  enableStudyLazyLoad,
  filters,
  sortCriteria,
  sortFunction,
}) => {
  const naturalizedInstancesMetadata = [];
  const seriesConcatenated = [];

  for (let i = 0; i < clients.length; i++) {
    const data = await retrieveStudyMetadata(
      clients[i].wadoDicomWebClient,
      StudyInstanceUID,
      enableStudyLazyLoad,
      filters,
      sortCriteria,
      sortFunction
    );
    const newSeries = new Map();
    // attach the client Name in each metadata
    data.forEach(item => {
      const naturalizedData = naturalizeDataset(item);
      if (
        !seriesConcatenated.includes(naturalizedData.SeriesInstanceUID) &&
        !newSeries.get(naturalizedData.SeriesInstanceUID)
      ) {
        naturalizedData.clientName = clients[i].name;
        newSeries.set(naturalizedData.SeriesInstanceUID, naturalizeDataset);
      }
    });

    // adding only instances belonging to new series
    newSeries.forEach((value, key) => {
      naturalizedInstancesMetadata.push(value);
      // adding new series to list of concatenated series
      seriesConcatenated.push(key);
    });
  }

  return naturalizedInstancesMetadata;
};

export const retrieveMergedStudyMetadata = async ({
  clients,
  StudyInstanceUID,
  enableStudyLazyLoad,
  filters,
  sortCriteria,
  sortFunction,
}) => {
  let seriesSummaryMetadata = [];
  let seriesPromises = [];

  // Get Series
  const seriesClientsMapping = {};
  for (let i = 0; i < clients.length; i++) {
    let clientSeriesSummaryMetadata, clientSeriesPromises;
    try {
      const { preLoadData, promises } = await retrieveStudyMetadata(
        clients[i].wadoDicomWebClient,
        StudyInstanceUID,
        enableStudyLazyLoad,
        filters,
        sortCriteria,
        sortFunction
      );
      clientSeriesSummaryMetadata = preLoadData;
      clientSeriesPromises = promises;
    } catch {
      clientSeriesSummaryMetadata = [];
      clientSeriesPromises = [];
    }

    // create a mapping between SeriesInstanceUID <--> clientName, for two reasons:
    // 1 - remove duplicates in series metadata
    // 2 - associate each instance in a series with the name of the client it was retrieved
    for (const [j, seriesSummary] of clientSeriesSummaryMetadata.entries()) {
      const seriesUID = seriesSummary.SeriesInstanceUID;

      if (!seriesClientsMapping[seriesUID]) {
        seriesClientsMapping[seriesUID] = clients[i].name;
        seriesSummaryMetadata.push(seriesSummary);
        seriesPromises.push(clientSeriesPromises[j]);
      }
    }
  }

  return {
    preLoadData: seriesSummaryMetadata,
    promises: seriesPromises,
    seriesClientsMapping,
  };
};

export default {
  mergedSearch,
  mergedSeriesSearch,
  retrieveMergedSeriesMetadata,
  retrieveMergedStudyMetadata,
};
