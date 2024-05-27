/** @type {AppTypes.Config} */
window.config = {
  routerBasename: '/',
  extensions: [],
  modes: [],
  showStudyList: true,
  // below flag is for performance reasons, but it might not work for all servers
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  // filterQueryParam: false,
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'dcmjs DICOMWeb Server',
        name: 'DCM4CHEE',
        wadoUriRoot: 'http://localhost:5985',
        qidoRoot: 'http://localhost:5985',
        wadoRoot: 'http://localhost:5985',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        imageRendering: 'wadouri',
        thumbnailRendering: 'wadouri',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: false,
        omitQuotationForMultipartRequest: true,
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        friendlyName: 'dicom json',
        name: 'json',
      },
    },
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'dicom local',
      },
    },
  ],
};
