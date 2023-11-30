import { DicomMetadataStore, IWebApiDataSource } from '@ohif/core';
import {
  mergeMap,
  callForAllDataSourcesAsync,
  callForAllDataSources,
  callForDefaultDataSource,
  callByRetrieveAETitle,
  createMergeDataSourceApi,
} from './index';

jest.mock('@ohif/core');

describe('MergeDataSource', () => {
  let path,
    sourceName,
    mergeConfig,
    extensionManager,
    series1,
    series2,
    series3,
    series4,
    mergeKey,
    tagFunc,
    dataSourceAndSeriesMap,
    dataSourceAndUIDsMap,
    dataSourceAndDSMap,
    pathSync;

  beforeAll(() => {
    path = 'query.series.search';
    pathSync = 'getImageIdsForInstance';
    tagFunc = jest.fn((data, sourceName) =>
      data.map(item => ({ ...item, RetrieveAETitle: sourceName }))
    );
    sourceName = 'dicomweb1';
    mergeKey = 'seriesInstanceUid';
    series1 = { [mergeKey]: '123' };
    series2 = { [mergeKey]: '234' };
    series3 = { [mergeKey]: '345' };
    series4 = { [mergeKey]: '456' };
    mergeConfig = {
      seriesMerge: {
        dataSourceNames: ['dicomweb1', 'dicomweb2'],
        defaultDataSourceName: 'dicomweb1',
      },
    };
    dataSourceAndSeriesMap = {
      dataSource1: series1,
      dataSource2: series2,
      dataSource3: series3,
    };
    dataSourceAndUIDsMap = {
      dataSource1: ['123'],
      dataSource2: ['234'],
      dataSource3: ['345'],
    };
    dataSourceAndDSMap = {
      dataSource1: {
        displaySet: {
          StudyInstanceUID: '123',
          SeriesInstanceUID: '123',
        },
      },
      dataSource2: {
        displaySet: {
          StudyInstanceUID: '234',
          SeriesInstanceUID: '234',
        },
      },
      dataSource3: {
        displaySet: {
          StudyInstanceUID: '345',
          SeriesInstanceUID: '345',
        },
      },
    };
    extensionManager = {
      dataSourceDefs: {
        dataSource1: {
          sourceName: 'dataSource1',
          configuration: {},
        },
        dataSource2: {
          sourceName: 'dataSource2',
          configuration: {},
        },
        dataSource3: {
          sourceName: 'dataSource3',
          configuration: {},
        },
      },
      getDataSources: jest.fn(dataSourceName => [
        {
          [path]: jest.fn().mockResolvedValue([dataSourceAndSeriesMap[dataSourceName]]),
        },
      ]),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('callForAllDataSourcesAsync', () => {
    it('should call the correct functions and return the merged data', async () => {
      /** Arrange */
      extensionManager.getDataSources = jest.fn(dataSourceName => [
        {
          [path]: jest.fn().mockResolvedValue([dataSourceAndSeriesMap[dataSourceName]]),
        },
      ]);

      /** Act */
      const data = await callForAllDataSourcesAsync({
        mergeMap,
        path,
        args: [],
        extensionManager,
        dataSourceNames: ['dataSource1', 'dataSource2'],
      });

      /** Assert */
      expect(extensionManager.getDataSources).toHaveBeenCalledTimes(2);
      expect(extensionManager.getDataSources).toHaveBeenCalledWith('dataSource1');
      expect(extensionManager.getDataSources).toHaveBeenCalledWith('dataSource2');
      expect(data).toEqual([series1, series2]);
    });
  });

  describe('callForAllDataSources', () => {
    it('should call the correct functions and return the merged data', () => {
      /** Arrange */
      extensionManager.getDataSources = jest.fn(dataSourceName => [
        {
          [pathSync]: () => dataSourceAndUIDsMap[dataSourceName],
        },
      ]);

      /** Act */
      const data = callForAllDataSources({
        path: pathSync,
        args: [],
        extensionManager,
        dataSourceNames: ['dataSource2', 'dataSource3'],
      });

      /** Assert */
      expect(extensionManager.getDataSources).toHaveBeenCalledTimes(2);
      expect(extensionManager.getDataSources).toHaveBeenCalledWith('dataSource2');
      expect(extensionManager.getDataSources).toHaveBeenCalledWith('dataSource3');
      expect(data).toEqual(['234', '345']);
    });
  });

  describe('callForDefaultDataSource', () => {
    it('should call the correct function and return the data', () => {
      /** Arrange */
      extensionManager.getDataSources = jest.fn(dataSourceName => [
        {
          [pathSync]: () => dataSourceAndUIDsMap[dataSourceName],
        },
      ]);

      /** Act */
      const data = callForDefaultDataSource({
        path: pathSync,
        args: [],
        extensionManager,
        defaultDataSourceName: 'dataSource2',
      });

      /** Assert */
      expect(extensionManager.getDataSources).toHaveBeenCalledTimes(1);
      expect(extensionManager.getDataSources).toHaveBeenCalledWith('dataSource2');
      expect(data).toEqual(['234']);
    });
  });

  describe('callByRetrieveAETitle', () => {
    it('should call the correct function and return the data', () => {
      /** Arrange */
      DicomMetadataStore.getSeries.mockImplementationOnce(() => [series2]);
      extensionManager.getDataSources = jest.fn(dataSourceName => [
        {
          [pathSync]: () => dataSourceAndUIDsMap[dataSourceName],
        },
      ]);

      /** Act */
      const data = callByRetrieveAETitle({
        path: pathSync,
        args: [dataSourceAndDSMap['dataSource2']],
        extensionManager,
        defaultDataSourceName: 'dataSource2',
      });

      /** Assert */
      expect(extensionManager.getDataSources).toHaveBeenCalledTimes(1);
      expect(extensionManager.getDataSources).toHaveBeenCalledWith('dataSource2');
      expect(data).toEqual(['234']);
    });
  });
});
