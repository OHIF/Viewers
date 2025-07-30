import { DicomMetadataStore, IWebApiDataSource } from '@ohif/core';
import get from 'lodash.get';
import uniqBy from 'lodash.uniqby';
import {
  MergeConfig,
  CallForAllDataSourcesAsyncOptions,
  CallForAllDataSourcesOptions,
  CallForDefaultDataSourceOptions,
  CallByRetrieveAETitleOptions,
  MergeMap,
} from './types';

export const mergeMap: MergeMap = {
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

/**
 * Calls all data sources asynchronously and merges the results.
 * @param {CallForAllDataSourcesAsyncOptions} options - The options for calling all data sources.
 * @param {string} options.path - The path to the function to be called on each data source.
 * @param {unknown[]} options.args - The arguments to be passed to the function.
 * @param {ExtensionManager} options.extensionManager - The extension manager.
 * @param {string[]} options.dataSourceNames - The names of the data sources to be called.
 * @param {string} options.defaultDataSourceName - The name of the default data source.
 * @returns {Promise<unknown[]>} - A promise that resolves to the merged data from all data sources.
 */
export const callForAllDataSourcesAsync = async ({
  mergeMap,
  path,
  args,
  extensionManager,
  dataSourceNames,
  defaultDataSourceName,
}: CallForAllDataSourcesAsyncOptions) => {
  const { mergeKey, tagFunc } = mergeMap[path] || { tagFunc: x => x };

  /** Sort by default data source */
  const defs = Object.values(extensionManager.dataSourceDefs);
  const defaultDataSourceDef = defs.find(def => def.sourceName === defaultDataSourceName);
  const dataSourceDefs = defs.filter(def => def.sourceName !== defaultDataSourceName);
  if (defaultDataSourceDef) {
    dataSourceDefs.unshift(defaultDataSourceDef);
  }

  const promises = [];
  const sourceNames = [];

  for (const dataSourceDef of dataSourceDefs) {
    const { configuration, sourceName } = dataSourceDef;
    if (!!configuration && dataSourceNames.includes(sourceName)) {
      const [dataSource] = extensionManager.getDataSources(sourceName);
      const func = get(dataSource, path);
      const promise = func.apply(dataSource, args);
      promises.push(promise);
      sourceNames.push(sourceName);
    }
  }

  const data = await Promise.allSettled(promises);
  const mergedData = data.map((data, i) => tagFunc(data.value, sourceNames[i]));

  let results = [];
  if (mergeKey) {
    results = uniqBy(mergedData.flat(), obj => get(obj, mergeKey));
  } else {
    results = mergedData.flat();
  }

  return results;
};

/**
 * Calls all data sources that match the provided names and merges their data.
 * @param options - The options for calling all data sources.
 * @param options.path - The path to the function to be called on each data source.
 * @param options.args - The arguments to be passed to the function.
 * @param options.extensionManager - The extension manager instance.
 * @param options.dataSourceNames - The names of the data sources to be called.
 * @param options.defaultDataSourceName - The name of the default data source.
 * @returns The merged data from all the matching data sources.
 */
export const callForAllDataSources = ({
  path,
  args,
  extensionManager,
  dataSourceNames,
  defaultDataSourceName,
}: CallForAllDataSourcesOptions) => {
  /** Sort by default data source */
  const defs = Object.values(extensionManager.dataSourceDefs);
  const defaultDataSourceDef = defs.find(def => def.sourceName === defaultDataSourceName);
  const dataSourceDefs = defs.filter(def => def.sourceName !== defaultDataSourceName);
  if (defaultDataSourceDef) {
    dataSourceDefs.unshift(defaultDataSourceDef);
  }

  const mergedData = [];
  for (const dataSourceDef of dataSourceDefs) {
    const { configuration, sourceName } = dataSourceDef;
    if (!!configuration && dataSourceNames.includes(sourceName)) {
      const [dataSource] = extensionManager.getDataSources(sourceName);
      const func = get(dataSource, path);
      const data = func.apply(dataSource, args);
      mergedData.push(data);
    }
  }

  return mergedData.flat();
};

/**
 * Calls the default data source function specified by the given path with the provided arguments.
 * @param {CallForDefaultDataSourceOptions} options - The options for calling the default data source.
 * @param {string} options.path - The path to the function within the default data source.
 * @param {unknown[]} options.args - The arguments to pass to the function.
 * @param {string} options.defaultDataSourceName - The name of the default data source.
 * @param {ExtensionManager} options.extensionManager - The extension manager instance.
 * @returns {unknown} - The result of calling the default data source function.
 */
export const callForDefaultDataSource = ({
  path,
  args,
  defaultDataSourceName,
  extensionManager,
}: CallForDefaultDataSourceOptions) => {
  const [dataSource] = extensionManager.getDataSources(defaultDataSourceName);
  const func = get(dataSource, path);
  return func.apply(dataSource, args);
};

/**
 * Calls the data source specified by the RetrieveAETitle of the given display set.
 * @typedef {Object} CallByRetrieveAETitleOptions
 * @property {string} path - The path of the method to call on the data source.
 * @property {any[]} args - The arguments to pass to the method.
 * @property {string} defaultDataSourceName - The name of the default data source.
 * @property {ExtensionManager} extensionManager - The extension manager.
 */
export const callByRetrieveAETitle = ({
  path,
  args,
  defaultDataSourceName,
  extensionManager,
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

function createMergeDataSourceApi(
  mergeConfig: MergeConfig,
  servicesManager: AppTypes.ServicesManager,
  extensionManager
) {
  const { seriesMerge } = mergeConfig;
  const { dataSourceNames, defaultDataSourceName } = seriesMerge;

  const implementation = {
    initialize: (...args: unknown[]) =>
      callForAllDataSources({
        path: 'initialize',
        args,
        extensionManager,
        dataSourceNames,
        defaultDataSourceName,
      }),
    query: {
      studies: {
        search: (...args: unknown[]) =>
          callForAllDataSourcesAsync({
            mergeMap,
            path: 'query.studies.search',
            args,
            extensionManager,
            dataSourceNames,
            defaultDataSourceName,
          }),
      },
      series: {
        search: (...args: unknown[]) =>
          callForAllDataSourcesAsync({
            mergeMap,
            path: 'query.series.search',
            args,
            extensionManager,
            dataSourceNames,
            defaultDataSourceName,
          }),
      },
      instances: {
        search: (...args: unknown[]) =>
          callForAllDataSourcesAsync({
            mergeMap,
            path: 'query.instances.search',
            args,
            extensionManager,
            dataSourceNames,
            defaultDataSourceName,
          }),
      },
    },
    retrieve: {
      bulkDataURI: (...args: unknown[]) =>
        callForAllDataSourcesAsync({
          mergeMap,
          path: 'retrieve.bulkDataURI',
          args,
          extensionManager,
          dataSourceNames,
          defaultDataSourceName,
        }),
      directURL: (...args: unknown[]) =>
        callForDefaultDataSource({
          path: 'retrieve.directURL',
          args,
          defaultDataSourceName,
          extensionManager,
        }),
      series: {
        metadata: (...args: unknown[]) =>
          callForAllDataSourcesAsync({
            mergeMap,
            path: 'retrieve.series.metadata',
            args,
            extensionManager,
            dataSourceNames,
            defaultDataSourceName,
          }),
      },
    },
    store: {
      dicom: (...args: unknown[]) =>
        callForDefaultDataSource({
          path: 'store.dicom',
          args,
          defaultDataSourceName,
          extensionManager,
        }),
    },
    deleteStudyMetadataPromise: (...args: unknown[]) =>
      callForAllDataSources({
        path: 'deleteStudyMetadataPromise',
        args,
        extensionManager,
        dataSourceNames,
        defaultDataSourceName,
      }),
    getImageIdsForDisplaySet: (...args: unknown[]) =>
      callByRetrieveAETitle({
        path: 'getImageIdsForDisplaySet',
        args,
        defaultDataSourceName,
        extensionManager,
      }),
    getImageIdsForInstance: (...args: unknown[]) =>
      callByRetrieveAETitle({
        path: 'getImageIdsForDisplaySet',
        args,
        defaultDataSourceName,
        extensionManager,
      }),
    getStudyInstanceUIDs: (...args: unknown[]) =>
      callForAllDataSources({
        path: 'getStudyInstanceUIDs',
        args,
        extensionManager,
        dataSourceNames,
        defaultDataSourceName,
      }),
  };

  return IWebApiDataSource.create(implementation);
}

export { createMergeDataSourceApi };
