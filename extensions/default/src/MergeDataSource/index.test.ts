import { DicomMetadataStore } from '@ohif/core';
import {
  mergeMap,
  callForAllDataSourcesAsync,
  callForAllDataSources,
  callForDefaultDataSource,
  callByRetrieveAETitle,
} from './index';

jest.mock('@ohif/core');

/** Those types aren't exported by their respective modules, thus defined here */
type DataSourceDefinition = {
  sourceName: string;
  configuration: object;
};
type SeriesData = Record<string, unknown>;
type DataSourceAndSeriesMap = Record<string, SeriesData>;
type DisplaySet = {
  StudyInstanceUID: string;
  SeriesInstanceUID: string;
};
type DataSourceAndDSMap = Record<string, { displaySet: DisplaySet }>;
type QuerySeriesSearchMock = jest.Mock<Promise<SeriesData[]>, []>;
type GetImageIdsForInstanceFn = () => string[];
type DataSourceInstance = {
  [key: string]: QuerySeriesSearchMock | GetImageIdsForInstanceFn;
};

describe('MergeDataSource', () => {
  let path: string, pathSync: string;

  let extensionManager: {
      dataSourceDefs: Record<string, DataSourceDefinition>;
      getDataSources: jest.Mock<DataSourceInstance[], [string]>;
    },
    series1: SeriesData,
    series2: SeriesData,
    series3: SeriesData,
    mergeKey: string,
    dataSourceAndSeriesMap: DataSourceAndSeriesMap,
    dataSourceAndUIDsMap: Record<string, string[]>,
    dataSourceAndDSMap: DataSourceAndDSMap;

  beforeAll(() => {
    path = 'query.series.search';
    pathSync = 'getImageIdsForInstance';
    mergeKey = 'seriesInstanceUid';
    series1 = { [mergeKey]: '123' };
    series2 = { [mergeKey]: '234' };
    series3 = { [mergeKey]: '345' };
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
        extensionManager: extensionManager as any,
        dataSourceNames: ['dataSource1', 'dataSource2'],
        defaultDataSourceName: 'dataSource1',
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
        extensionManager: extensionManager as any,
        dataSourceNames: ['dataSource2', 'dataSource3'],
        defaultDataSourceName: 'dataSource1',
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
        extensionManager: extensionManager as any,
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
      const mockedGetSeries = DicomMetadataStore.getSeries as jest.Mock;

      /** Arrange */
      mockedGetSeries.mockImplementationOnce(() => [series2]);
      extensionManager.getDataSources = jest.fn(dataSourceName => [
        {
          [pathSync]: () => dataSourceAndUIDsMap[dataSourceName],
        },
      ]);

      /** Act */
      const data = callByRetrieveAETitle({
        path: pathSync,
        args: [dataSourceAndDSMap['dataSource2']],
        extensionManager: extensionManager as any,
        defaultDataSourceName: 'dataSource2',
      });

      /** Assert */
      expect(extensionManager.getDataSources).toHaveBeenCalledTimes(1);
      expect(extensionManager.getDataSources).toHaveBeenCalledWith('dataSource2');
      expect(data).toEqual(['234']);
    });
  });
});
