import { DicomMetadataStore, IWebApiDataSource } from '@ohif/core';
import { executeFunction, getKeyByLevel } from './utils';

function createMergeDataSourceApi(mergeConfig, UserAuthenticationService, extensionManager) {
  const { seriesMerge } = mergeConfig;
  const { dataSourceNames } = seriesMerge;

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

        const getDedupedData = ({ globalData, incomingData, mergeKey, level }) => {
          const keys = globalData.map(r => getKeyByLevel(r, mergeKey, level));
          return incomingData.filter(r => !keys.includes(getKeyByLevel(r, mergeKey, level)));
        };

        const processDedupedData = ({ sourceName, globalData, incomingData, mergeKey, level }) => {
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
            data = data.concat(data);
          }
          globalData.push(tagFunc(data, sourceName));
        };

        promise.then(data =>
          processDedupedData({ sourceName, globalData, incomingData: data, mergeKey, level })
        );
      }
    }

    await Promise.allSettled(promises);

    return globalData.flat();
  };

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

  const callForDefaultDataSource = (path, args) => {
    const defaultDataSourceName = dataSourceNames[0];
    const [dataSource] = extensionManager.getDataSources(defaultDataSourceName);
    return executeFunction(dataSource, path, args);
  };

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
