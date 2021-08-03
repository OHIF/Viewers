window.config = {
  routerBasename: ‘/’,
  showStudyList: true,
  extensions: [],
  modes: [],
  dataSources: [
    {
      friendlyName: ‘DCM4CHEE Server’,
      namespace: ‘org.ohif.default.dataSourcesModule.dicomweb’,
      sourceName: ‘dicomweb’,
      configuration: {
        name: ‘DCM4CHEE’,
        wadoUriRoot: ‘http://localhost:5000’,
        qidoRoot: ‘http://localhost:5000’,
        wadoRoot: ‘http://localhost:5000’,
        qidoSupportsIncludeField: true,
        imageRendering: ‘wadors’,
        thumbnailRendering: ‘wadors’
      },
    },
  ],
  studyListFunctionsEnabled: true,
  defaultDataSourceName: ‘dicomweb’,
};
