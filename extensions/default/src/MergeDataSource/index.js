import { DicomMetadataStore, IWebApiDataSource } from '@ohif/core';
import { executeFunction, getKeyByLevel } from './utils';

/**
 * Returns deduplicated data by comparing the incomingData with the globalData based on the mergeKey and level.
 * @param {Object} options - The options object.
 * @param {Array} options.globalData - The global data array.
 * @param {Array} options.incomingData - The incoming data array.
 * @param {string} options.mergeKey - The merge key.
 * @param {number} options.level - The level.
 * @returns {Array} The deduplicated data array.
 */
const getDedupedData = ({ globalData, incomingData, mergeKey, level }) => {
  const keys = globalData.map(r => getKeyByLevel(r, mergeKey, level));
  return incomingData.filter(r => !keys.includes(getKeyByLevel(r, mergeKey, level)));
};

/**
 * Processes deduplicated data and pushes it to globalData array.
 * @param {Object} options - The options object.
 * @param {string} options.sourceName - The name of the data source.
 * @param {Array} options.globalData - The global data array.
 * @param {Array} options.incomingData - The incoming data array.
 * @param {string} options.mergeKey - The key to merge the data on.
 * @param {number} options.level - The level to merge the data on.
 * @param {Function} options.tagFunc - The function to tag the data with.
 */
const processDedupedData = ({ sourceName, globalData, incomingData, mergeKey, level, tagFunc }) => {
  let data = [];
  if (mergeKey && level !== -1) {
    const dedupedData = getDedupedData({
      globalData: globalData.flat(),
      incomingData,
      mergeKey,
      level,
    });
    data = data.concat(dedupedData);
  } else {
    data = data.concat(incomingData);
  }
  globalData.push(tagFunc(data, sourceName));
};

function createMergeDataSourceApi(mergeConfig, UserAuthenticationService, extensionManager) {
  const { seriesMerge } = mergeConfig;
  const { dataSourceNames } = seriesMerge;

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
    let globalData = [];

    for (const dataSourceDef of dataSourceDefs) {
      const { configuration, sourceName } = dataSourceDef;
      if (configuration && dataSourceNames.includes(sourceName)) {
        const [dataSource] = extensionManager.getDataSources(sourceName);
        const promise = executeFunction(dataSource, path, args);
        promises.push(promise);

        promise.then(data =>
          processDedupedData({
            sourceName,
            globalData,
            incomingData: data,
            mergeKey,
            level,
            tagFunc,
          })
        );
      }
    }

    await Promise.allSettled(promises);

    return globalData.flat();
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
    const globalData = [];
    for (const dataSourceDef of dataSourceDefs) {
      const { configuration, sourceName } = dataSourceDef;
      if (configuration && dataSourceNames.includes(sourceName)) {
        const [dataSource] = extensionManager.getDataSources(sourceName);
        const data = executeFunction(dataSource, path, args);
        globalData.push(data);
      }
    }
    return globalData.flat();
  };

  /**
   * Calls the default data source with the given path and arguments.
   * @param {string} path - The path to the function to be executed.
   * @param {Array} args - The arguments to be passed to the function.
   * @returns {*} - The result of executing the function.
   */
  const callForDefaultDataSource = (path, args) => {
    const defaultDataSourceName = dataSourceNames[0];
    const [dataSource] = extensionManager.getDataSources(defaultDataSourceName);
    return executeFunction(dataSource, path, args);
  };

  /**
   * Calls a method on the data source associated with the given display set's RetrieveAETitle or the default data source if none is found.
   * @param {string} path - The path of the method to call.
   * @param {Array} args - The arguments to pass to the method.
   * @returns {*} - The result of calling the method.
   */
  const callByRetrieveAETitle = (path, args) => {
    const [displaySet] = args;
    const seriesMetadata = DicomMetadataStore.getSeries(
      displaySet.StudyInstanceUID,
      displaySet.SeriesInstanceUID
    );
    const defaultDataSourceName = dataSourceNames[0];
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
      dicom: (...args) => callForDefaultDataSource('store.dicom', args),
    },
    deleteStudyMetadataPromise: (...args) =>
      callForAllDataSources('deleteStudyMetadataPromise', args),
    getImageIdsForDisplaySet: (...args) => callByRetrieveAETitle('getImageIdsForDisplaySet', args),
    getImageIdsForInstance: (...args) => callByRetrieveAETitle('getImageIdsForDisplaySet', args),
    getStudyInstanceUIDs: (...args) => callForAllDataSources('getStudyInstanceUIDs', args),
  };

  return IWebApiDataSource.create(implementation);
}

export { createMergeDataSourceApi };
