window.config = {
  routerBasename: '/',
  showStudyList: true,
  extensions: [],
  modes: [],
  // below flag is for performance reasons, but it might not work for all servers
  omitQuotationForMultipartRequest: true,
  dataSources: [
    {
      friendlyName: 'DCM4CHEE Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'DCM4CHEE',
        wadoUriRoot: 'http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        requestOptions: {
          auth: 'admin:admin',
        },
      },
    },
  ],
  studyListFunctionsEnabled: true,
  defaultDataSourceName: 'dicomweb',
};
