import { DicomMetadataStore, ExtensionManager, Types, IWebApiDataSource } from '@ohif/core';
import { get } from 'lodash';

type MergeDataSourceOptions = {
  mergedData: any[];
  incomingData: any[];
  mergeKey: string;
};

type ProcessDedupedDataOptions = {
  sourceName: string;
  mergedData: any[];
  incomingData: any[];
  mergeKey: string;
  tagFunc: (data: any[], sourceName: string) => any[];
};

type MergeMap = {
  [key: string]: {
    mergeKey: string;
    tagFunc: (data: any[], sourceName: string) => any[];
  };
};

type CallForAllDataSourcesAsyncOptions = {
  path: string;
  args: any[];
};

type CallForAllDataSourcesOptions = {
  path: string;
  args: any[];
};

type CallForDefaultDataSourceOptions = {
  path: string;
  args: any[];
  defaultDataSourceName: string;
};

type CallByRetrieveAETitleOptions = {
  path: string;
  args: any[];
  defaultDataSourceName: string;
};

type MergeConfig = {
  seriesMerge: {
    dataSourceNames: string[];
    defaultDataSourceName: string;
  };
};

const mergeMap: MergeMap = {
  'query.studies.search': {
    mergeKey: 'studyInstanceUid',
    tagFunc: x => x,
  },
  'query.series.search': {
    mergeKey: 'seriesInstanceUid',
    tagFunc: (series, sourceName) => {
      series.forEach(series => {
        series.RetrieveAETitle = sourceName;
        DicomMetadataStore.updateSeriesMetadata(series);
      });
      return series;
    },
  },
};

function createMergeDataSourceApi(
  mergeConfig: MergeConfig,
  UserAuthenticationService: any,
  extensionManager: ExtensionManager
) {
  const { seriesMerge } = mergeConfig;
  const { dataSourceNames, defaultDataSourceName } = seriesMerge;

  const getDedupedData = ({ mergedData, incomingData, mergeKey }: MergeDataSourceOptions) => {
    const keys = mergedData.map(r => get(r, mergeKey));
    return incomingData.filter(r => !keys.includes(get(r, mergeKey)));
  };

  const processDedupedData = ({
    sourceName,
    mergedData,
    incomingData,
    mergeKey,
    tagFunc,
  }: ProcessDedupedDataOptions) => {
    let data = [];
    if (mergeKey) {
      const dedupedData = getDedupedData({
        mergedData: mergedData.flat(),
        incomingData,
        mergeKey,
      });
      data = data.concat(dedupedData);
    } else {
      data = data.concat(incomingData);
    }
    mergedData.push(tagFunc(data, sourceName));
  };

  const callForAllDataSourcesAsync = async ({ path, args }: CallForAllDataSourcesAsyncOptions) => {
    const { mergeKey, tagFunc } = mergeMap[path] || { tagFunc: x => x };

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
              tagFunc,
            })
          )
        );
      }
    }

    await Promise.allSettled(promises);

    return mergedData.flat();
  };

  const callForAllDataSources = ({ path, args }: CallForAllDataSourcesOptions) => {
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

  const callForDefaultDataSource = ({
    path,
    args,
    defaultDataSourceName,
  }: CallForDefaultDataSourceOptions) => {
    const [dataSource] = extensionManager.getDataSources(defaultDataSourceName);
    const func = get(dataSource, path);
    return func.apply(dataSource, args);
  };

  const callByRetrieveAETitle = ({
    path,
    args,
    defaultDataSourceName,
  }: CallByRetrieveAETitleOptions) => {
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
    initialize: (...args: any[]) => callForAllDataSources({ path: 'initialize', args }),
    query: {
      studies: {
        search: (...args: any[]) =>
          callForAllDataSourcesAsync({ path: 'query.studies.search', args }),
      },
      series: {
        search: (...args: any[]) =>
          callForAllDataSourcesAsync({ path: 'query.series.search', args }),
      },
      instances: {
        search: (...args: any[]) =>
          callForAllDataSourcesAsync({ path: 'query.instances.search', args }),
      },
    },
    retrieve: {
      bulkDataURI: (...args: any[]) =>
        callForAllDataSourcesAsync({ path: 'retrieve.bulkDataURI', args }),
      directURL: (...args: any[]) =>
        callForDefaultDataSource({ path: 'retrieve.directURL', args, defaultDataSourceName }),
      series: {
        metadata: (...args: any[]) =>
          callForAllDataSourcesAsync({ path: 'retrieve.series.metadata', args }),
      },
    },
    store: {
      dicom: (...args: any[]) =>
        callForDefaultDataSource({ path: 'store.dicom', args, defaultDataSourceName }),
    },
    deleteStudyMetadataPromise: (...args: any[]) =>
      callForAllDataSources({ path: 'deleteStudyMetadataPromise', args }),
    getImageIdsForDisplaySet: (...args: any[]) =>
      callByRetrieveAETitle({ path: 'getImageIdsForDisplaySet', args, defaultDataSourceName }),
    getImageIdsForInstance: (...args: any[]) =>
      callByRetrieveAETitle({ path: 'getImageIdsForDisplaySet', args, defaultDataSourceName }),
    getStudyInstanceUIDs: (...args: any[]) =>
      callForAllDataSources({ path: 'getStudyInstanceUIDs', args }),
  };

  return IWebApiDataSource.create(implementation);
}

export { createMergeDataSourceApi };
