window.config = {
  routerBasename: '/',
  showStudyList: true,
  extensions: [],
  modes: [],
  dataSources: [
    {
      friendlyName: 'DCM4CHEE Server',
      namespace: 'org.ohif.default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'DCM4CHEE',
        wadoUriRoot: 'http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoUrlPrefix: 'http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoUrlPrefix: 'http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs',
        stowUrlPrefix: 'http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs',
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
