import { DicomMetadataStore, IWebApiDataSource } from '@ohif/core';
import { get } from 'lodash';
import { executeFunction, getKeyByLevel } from './utils';

/**
 * Returns deduplicated data by comparing the incomingData with the mergedData based on the mergeKey and level.
 * @param {Object} options - The options object.
 * @param {Array} options.mergedData - The global data array.
 * @param {Array} options.incomingData - The incoming data array.
 * @param {string} options.mergeKey - The merge key.
 * @param {number} options.level - The level.
 * @returns {Array} The deduplicated data array.
 */
const getDedupedData = ({ mergedData, incomingData, mergeKey, level }) => {
  const keys = mergedData.map(r => getKeyByLevel(r, mergeKey, level));
  return incomingData.filter(r => !keys.includes(getKeyByLevel(r, mergeKey, level)));
};

/**
 * Processes deduplicated data and pushes it to mergedData array.
 * @param {Object} options - The options object.
 * @param {string} options.sourceName - The name of the data source.
 * @param {Array} options.mergedData - The global data array.
 * @param {Array} options.incomingData - The incoming data array.
 * @param {string} options.mergeKey - The key to merge the data on.
 * @param {number} options.level - The level to merge the data on.
 * @param {Function} options.tagFunc - The function to tag the data with.
 */
const processDedupedData = ({ sourceName, mergedData, incomingData, mergeKey, level, tagFunc }) => {
  let data = [];
  if (mergeKey && level !== -1) {
    const dedupedData = getDedupedData({
      mergedData: mergedData.flat(),
      incomingData,
      mergeKey,
      level,
    });
    data = data.concat(dedupedData);
  } else {
    data = data.concat(incomingData);
  }
  mergedData.push(tagFunc(data, sourceName));
};

function createMergeDataSourceApi(mergeConfig, UserAuthenticationService, extensionManager) {
  const { seriesMerge } = mergeConfig;
  const { dataSourceNames, defaultDataSourceName } = seriesMerge;

  /**
   * Calls a specified function on all data sources and merges the results.
   *
   * @async
   * @function
   * @param {string} path - The path of the function to call.
   * @param {Object} args - The arguments to pass to the function.
   * @returns {Promise<Array>} - A promise that resolves to an array of merged data.
   */
  const callForAllDataSourcesAsync = async (path, args) => {
    const mergeMap = {
      'query.studies.search': {
        mergeKey: 'studyInstanceUid',
        level: 0,
        /** TODO */
        tagFunc: x => x,
      },
      'retrieve.series.metadata': {
        mergeKey: 'seriesInstanceUid',
        level: 0,
        tagFunc: (series, sourceName) => {
          series.forEach(series => {
            series.RetrieveAETitle = sourceName;
            DicomMetadataStore.updateSeriesMetadata(series);
          });
          return series;
        },
      },
    };

    const { mergeKey, level, tagFunc } = mergeMap[path] || { tagFunc: x => x, level: -1 };

    const dataSourceDefs = Object.values(extensionManager.dataSourceDefs);
    const promises = [];
    const mergedData = [];

    for (const dataSourceDef of dataSourceDefs) {
      const { configuration, sourceName } = dataSourceDef;
      if (configuration && dataSourceNames.includes(sourceName)) {
        const [dataSource] = extensionManager.getDataSources(sourceName);
        const func = get(dataSource, path);
        const promise = func.apply(dataSource, args);
        promises.push(
          promise.then(data =>
            processDedupedData({
              sourceName,
              mergedData,
              incomingData: data,
              mergeKey,
              level,
              tagFunc,
            })
          )
        );
      }
    }

    await Promise.allSettled(promises);

    return mergedData.flat();
  };

  /**
   * Calls a function with the given path and arguments on all data sources that are included in the given list of data source names.
   * Returns an array of the results from each data source.
   *
   * @param {string} path - The path of the function to call on each data source.
   * @param {Array} args - The arguments to pass to the function on each data source.
   * @returns {Array} - An array of the results from each data source.
   */
  const callForAllDataSources = (path, args) => {
    const dataSourceDefs = Object.values(extensionManager.dataSourceDefs);
    const mergedData = [];
    for (const dataSourceDef of dataSourceDefs) {
      const { configuration, sourceName } = dataSourceDef;
      if (configuration && dataSourceNames.includes(sourceName)) {
        const [dataSource] = extensionManager.getDataSources(sourceName);
        const func = get(dataSource, path);
        const data = func.apply(dataSource, args);
        mergedData.push(data);
      }
    }
    return mergedData.flat();
  };

  /**
   * Calls the default data source with the given path and arguments.
   * @param {string} path - The path to the function to be executed.
   * @param {Array} args - The arguments to be passed to the function.
   * @param {string} defaultDataSourceName - The name of the default data source.
   * @returns {*} - The result of executing the function.
   */
  const callForDefaultDataSource = (path, args, defaultDataSourceName) => {
    const [dataSource] = extensionManager.getDataSources(defaultDataSourceName);
    const func = get(dataSource, path);
    return func.apply(dataSource, args);
  };

  /**
   * Calls a method on the data source associated with the given RetrieveAETitle or the default data source name.
   *
   * @param {string} path - The path of the method to call.
   * @param {Array} args - The arguments to pass to the method.
   * @param {string} defaultDataSourceName - The name of the default data source.
   * @returns {*} - The result of calling the method on the data source.
   */
  const callByRetrieveAETitle = (path, args, defaultDataSourceName) => {
    const [displaySet] = args;
    const seriesMetadata = DicomMetadataStore.getSeries(
      displaySet.StudyInstanceUID,
      displaySet.SeriesInstanceUID
    );
    const [dataSource] = extensionManager.getDataSources(
      seriesMetadata.RetrieveAETitle || defaultDataSourceName
    );
    return dataSource[path](...args);
  };

  const implementation = {
    initialize: (...args) => callForAllDataSources('initialize', args),
    query: {
      studies: {
        search: (...args) => callForAllDataSourcesAsync('query.studies.search', args),
      },
      series: {
        search: (...args) => callForAllDataSourcesAsync('query.series.search', args),
      },
      instances: {
        search: (...args) => callForAllDataSourcesAsync('query.instances.search', args),
      },
    },
    retrieve: {
      bulkDataURI: (...args) => callForAllDataSourcesAsync('retrieve.series.metadata', args),
      directURL: (...args) => callForAllDataSourcesAsync('retrieve.directURL', args),
      series: {
        metadata: (...args) => callForAllDataSourcesAsync('retrieve.series.metadata', args),
      },
    },
    store: {
      dicom: (...args) => callForDefaultDataSource('store.dicom', args, defaultDataSourceName),
    },
    deleteStudyMetadataPromise: (...args) =>
      callForAllDataSources('deleteStudyMetadataPromise', args),
    getImageIdsForDisplaySet: (...args) =>
      callByRetrieveAETitle('getImageIdsForDisplaySet', args, defaultDataSourceName),
    getImageIdsForInstance: (...args) =>
      callByRetrieveAETitle('getImageIdsForDisplaySet', args, defaultDataSourceName),
    getStudyInstanceUIDs: (...args) => callForAllDataSources('getStudyInstanceUIDs', args),
  };

  return IWebApiDataSource.create(implementation);
}

export { createMergeDataSourceApi };
