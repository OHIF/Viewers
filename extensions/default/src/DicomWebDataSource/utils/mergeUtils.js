import dcmjs from 'dcmjs';

import { retrieveStudyMetadata } from '../retrieveStudyMetadata';
import mergeResults from './mergeResults';

const { DicomMetaDictionary } = dcmjs.data;
const { naturalizeDataset } = DicomMetaDictionary;

const STUDY_INSTANCE_UID = '0020000D';
const SERIES_INSTANCE_UID = '0020000E';

/**
 * Merges search results from multiple DICOMWeb clients.
 * @param {Object} options - The options object.
 * @param {Array} options.clients - The array of DICOMWeb clients to search.
 * @param {Object} options.origParams - The original search parameters.
 * @param {Function} options.mapParams - The function to map search parameters to each client.
 * @param {Function} options.qidoSearch - The function to perform the QIDO search.
 * @returns {Promise<Array>} - A promise that resolves to the merged search results.
 */
export const mergedSearch = async ({ clients, origParams, mapParams, qidoSearch }) => {
  const clientResultsPromises = clients.map(client => {
    const mappedParams =
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
 * Merges series search results from multiple DICOMweb clients.
 * @param {Object} options - The options object.
 * @param {Array} options.clients - The array of DICOMweb clients.
 * @param {Function} options.seriesInStudy - The function that returns the series in a study for a given client and study instance UID.
 * @param {string} options.studyInstanceUid - The study instance UID.
 * @returns {Promise<Array>} - The merged series search results.
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
 * Retrieves merged series metadata from multiple DICOMWeb clients.
 * @async
 * @function retrieveMergedSeriesMetadata
 * @param {Object} options - The options object.
 * @param {Array} options.clients - The array of DICOMWeb clients.
 * @param {string} options.StudyInstanceUID - The Study Instance UID.
 * @param {boolean} options.enableStudyLazyLoad - Whether to enable lazy loading for studies.
 * @param {Object} options.filters - The filters to apply to the metadata.
 * @param {string} options.sortCriteria - The criteria to sort the metadata.
 * @param {Function} options.sortFunction - The function to use for sorting.
 * @returns {Promise<Array>} The naturalized instances metadata.
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

/**
 * Retrieves merged study metadata from multiple DICOMweb clients.
 * @async
 * @param {Object} options - The options object.
 * @param {Array} options.clients - The array of DICOMweb clients.
 * @param {string} options.StudyInstanceUID - The Study Instance UID.
 * @param {boolean} options.enableStudyLazyLoad - Whether to enable lazy loading of the study.
 * @param {Object} options.filters - The filters to apply to the study.
 * @param {string} options.sortCriteria - The criteria to sort the study by.
 * @param {Function} options.sortFunction - The function to use for sorting.
 * @returns {Promise<Object>} The merged study metadata, including preloaded data, promises, and a mapping between series instance UIDs and client names.
 */
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

const mergeUtils = {
  mergedSearch,
  mergedSeriesSearch,
  retrieveMergedSeriesMetadata,
  retrieveMergedStudyMetadata,
};

export default mergeUtils;
