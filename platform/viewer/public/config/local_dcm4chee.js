window.config = {
  routerBasename: '/',
  showStudyList: true,
  extensions: [],
  modes: [],
  // below flag is for performance reasons, but it might not work for all servers
  omitQuotationForMultipartRequest: true,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  dataSources: [
    {
      friendlyName: 'DCM4CHEE Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'DCM4CHEE',
        wadoUriRoot: 'http://localhost/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'http://localhost/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'http://localhost/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        enableStudyLazyLoad: true,
        thumbnailRendering: 'wadors',
        requestOptions: {
          auth: 'admin:admin',
        },
      },
    },
    {
      friendlyName: 'dicom json',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        name: 'json',
      },
    },
    {
      friendlyName: 'dicom local',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {},
    },
  ],
  studyListFunctionsEnabled: true,
  defaultDataSourceName: 'dicomweb',
};
