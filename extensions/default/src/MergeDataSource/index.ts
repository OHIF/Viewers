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

/**
 * Global map to track which data source each series came from.
 * Key: SeriesInstanceUID, Value: sourceName
 */
const seriesSourceMap = new Map<string, string>();

export const getSeriesSource = (seriesUID: string): string | undefined => {
  return seriesSourceMap.get(seriesUID);
};

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
  /**
   * Tag instances from retrieve.series.metadata with RetrieveAETitle.
   * This ensures getImageIdsForDisplaySet knows which data source to use
   * when loading images, even if query.series.search was not called first.
   */
  'retrieve.series.metadata': {
    tagFunc: (seriesResults, sourceName) => {
      /**
       * seriesResults is an array of { metadata, start } objects
       * where metadata contains the DICOM attributes including SeriesInstanceUID
       */
      if (Array.isArray(seriesResults)) {
        seriesResults.forEach(result => {
          /** Tag the result object */
          result.RetrieveAETitle = sourceName;

          /** Also tag the metadata if it exists */
          if (result.metadata) {
            result.metadata.RetrieveAETitle = sourceName;
          }

          /**
           * Store in global map for reliable lookup later.
           * Use "last wins" strategy - if a series exists in multiple sources,
           * the non-default source (e.g., GCP) takes precedence since the default
           * source (IDC) may return metadata for series it can't actually serve.
           */
          const seriesUID = result.metadata?.SeriesInstanceUID || result.SeriesInstanceUID;
          if (seriesUID) {
            seriesSourceMap.set(seriesUID, sourceName);
          }

          /** Also try to update series metadata in DicomMetadataStore if it exists */
          const studyUID = result.metadata?.StudyInstanceUID || result.StudyInstanceUID;
          if (seriesUID && studyUID) {
            const seriesMeta = DicomMetadataStore.getSeries(studyUID, seriesUID);
            if (seriesMeta && !seriesMeta.RetrieveAETitle) {
              seriesMeta.RetrieveAETitle = sourceName;
              DicomMetadataStore.updateSeriesMetadata(seriesMeta);
            }
          }
        });
      }
      return seriesResults;
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

  const settledResults = await Promise.allSettled(promises);

  const mergedData = [];
  for (let i = 0; i < settledResults.length; i++) {
    const result = settledResults[i];
    const sourceName = sourceNames[i];

    if (result.status === 'fulfilled') {
      const taggedData = tagFunc(result.value, sourceName);
      mergedData.push(taggedData);
    } else {
      console.warn(`[MergeDataSource] ${path} from '${sourceName}' failed:`, result.reason);
    }
  }

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
  const [firstArg] = args;

  /**
   * Determine the data source from the argument.
   * Lookup order:
   * 1. instance.RetrieveAETitle (if present)
   * 2. seriesSourceMap (global map populated during retrieve.series.metadata)
   * 3. DicomMetadataStore series metadata
   * 4. defaultDataSourceName (fallback)
   */
  let retrieveAETitle: string | undefined;
  let seriesUID: string | undefined;

  if (firstArg?.instance) {
    /** getImageIdsForInstance case: { instance, frame } */
    const { instance } = firstArg;
    seriesUID = instance.SeriesInstanceUID;
    retrieveAETitle = instance.RetrieveAETitle;

    if (!retrieveAETitle && seriesUID) {
      retrieveAETitle = seriesSourceMap.get(seriesUID);
    }

    if (!retrieveAETitle) {
      const seriesMetadata = DicomMetadataStore.getSeries(
        instance.StudyInstanceUID,
        seriesUID
      );
      retrieveAETitle = seriesMetadata?.RetrieveAETitle;
    }
  } else if (firstArg?.StudyInstanceUID) {
    /** getImageIdsForDisplaySet case: displaySet object */
    seriesUID = firstArg.SeriesInstanceUID;

    if (seriesUID) {
      retrieveAETitle = seriesSourceMap.get(seriesUID);
    }

    if (!retrieveAETitle) {
      const seriesMetadata = DicomMetadataStore.getSeries(
        firstArg.StudyInstanceUID,
        seriesUID
      );
      retrieveAETitle = seriesMetadata?.RetrieveAETitle;
    }
  }

  const selectedSource = retrieveAETitle || defaultDataSourceName;

  const [dataSource] = extensionManager.getDataSources(selectedSource);
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
      getGetThumbnailSrc: (...args: unknown[]) =>
        callForDefaultDataSource({
          path: 'retrieve.getGetThumbnailSrc',
          args,
          defaultDataSourceName,
          extensionManager,
        }),
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
      renderedURL: (...args: unknown[]) => {
        const [dataSource] = extensionManager.getDataSources(defaultDataSourceName);
        const renderedURL = get(dataSource, 'retrieve.renderedURL');

        if (renderedURL) {
          return renderedURL.apply(dataSource, args);
        }

        const directURL = get(dataSource, 'retrieve.directURL');

        if (!directURL) {
          return Promise.resolve({ url: null });
        }

        return Promise.resolve(directURL.apply(dataSource, [args[0]])).then(url => ({
          url: (url as string | undefined | null) || null,
        }));
      },
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
      /**
       * Route prefetchInstanceFrames to the correct data source based on the instance's series.
       * This is critical for SEG loading where the entire Part 10 instance is prefetched.
       */
      prefetchInstanceFrames: (args: { instance: unknown; imageId: string }) => {
        const instance = args?.instance as
          | { SeriesInstanceUID?: string; RetrieveAETitle?: string; StudyInstanceUID?: string }
          | undefined;

        let retrieveAETitle: string | undefined;
        const seriesUID = instance?.SeriesInstanceUID;

        /** Check instance's RetrieveAETitle first */
        if (instance?.RetrieveAETitle) {
          retrieveAETitle = instance.RetrieveAETitle;
        }

        /** Fall back to seriesSourceMap */
        if (!retrieveAETitle && seriesUID) {
          retrieveAETitle = seriesSourceMap.get(seriesUID);
        }

        /** Fall back to DicomMetadataStore */
        if (!retrieveAETitle && seriesUID && instance?.StudyInstanceUID) {
          const seriesMetadata = DicomMetadataStore.getSeries(
            instance.StudyInstanceUID,
            seriesUID
          );
          retrieveAETitle = seriesMetadata?.RetrieveAETitle;
        }

        const selectedSource = retrieveAETitle || defaultDataSourceName;

        const [dataSource] = extensionManager.getDataSources(selectedSource);
        return dataSource?.retrieve?.prefetchInstanceFrames?.(args);
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
        path: 'getImageIdsForInstance',
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
