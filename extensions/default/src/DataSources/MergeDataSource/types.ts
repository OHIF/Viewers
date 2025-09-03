import { ExtensionManager } from '@ohif/core';

export type MergeMap = {
  [key: string]: {
    mergeKey: string;
    tagFunc: (data: unknown[], sourceName: string) => unknown[];
  };
};

export type CallForAllDataSourcesAsyncOptions = {
  mergeMap: object;
  path: string;
  args: unknown[];
  dataSourceNames: string[];
  extensionManager: ExtensionManager;
  defaultDataSourceName: string;
};

export type CallForAllDataSourcesOptions = {
  path: string;
  args: unknown[];
  dataSourceNames: string[];
  extensionManager: ExtensionManager;
  defaultDataSourceName: string;
};

export type CallForDefaultDataSourceOptions = {
  path: string;
  args: unknown[];
  defaultDataSourceName: string;
  extensionManager: ExtensionManager;
};

export type CallByRetrieveAETitleOptions = {
  path: string;
  args: unknown[];
  defaultDataSourceName: string;
  extensionManager: ExtensionManager;
};

export type MergeConfig = {
  seriesMerge: {
    dataSourceNames: string[];
    defaultDataSourceName: string;
  };
};
