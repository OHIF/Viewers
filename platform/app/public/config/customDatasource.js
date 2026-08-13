/** @type {AppTypes.Config} */
window.config = {
  routerBasename: null,
  extensions: [],
  modes: [],
  showStudyList: true,
  showLoadingIndicator: true,
  showErrorDetails: 'always',
  defaultDataSourceName: 'chavi',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.chavi',
      sourceName: 'chavi',
      configuration: {
        friendlyName: 'Chavi S3 ZIP DICOM (Lazy)',
        name: 'chavi',
        parentOrigin: process.env.DICOMZIP_PARENT_ORIGIN || '*',
      },
    },
  ],
  httpErrorHandler: error => {
    console.warn(error.message);
  },
};
