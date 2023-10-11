export type DataSourceDefinition = {
  // TODO friendlyName to move to configuration; here now for legacy purposes
  friendlyName: string;
  namespace: string;
  sourceName: string;
  configuration: any;
};
