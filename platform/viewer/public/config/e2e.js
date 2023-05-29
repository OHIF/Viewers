window.config = {
  routerBasename: '/',
  extensions: [],
  modes: ['@ohif/mode-test'],
  showStudyList: true,
  // below flag is for performance reasons, but it might not work for all servers
  omitQuotationForMultipartRequest: true,
  maxNumberOfWebWorkers: 3,
  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: false,
  strictZSpacingForVolumeViewport: true,
  // filterQueryParam: false,
  defaultDataSourceName: 'e2e',
  dataSources: [
    {
      friendlyName: 'StaticWado test data',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'e2e',
      configuration: {
        // The most important field to set for static WADO
        staticWado: true,
        name: 'StaticWADO',
        wadoUriRoot: '/viewer-testdata',
        qidoRoot: '/viewer-testdata',
        wadoRoot: '/viewer-testdata',
        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        singlepart: 'video,thumbnail,pdf',
      },
    },
    {
      friendlyName: 'Static WADO Local Data',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'local',
      configuration: {
        name: 'DCM4CHEE',
        qidoRoot: '/dicomweb',
        wadoRoot: '/dicomweb',
        qidoSupportsIncludeField: false,
        supportsReject: true,
        supportsStow: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'bulkdata,video,pdf',
      },
    },
    {
      friendlyName: 'dcmjs DICOMWeb Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'ohif',
      configuration: {
        name: 'aws',
        // old server
        // wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        // qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        // wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        // new server
        wadoUriRoot: 'https://d33do7qe4w26qo.cloudfront.net/dicomweb',
        qidoRoot: 'https://d33do7qe4w26qo.cloudfront.net/dicomweb',
        wadoRoot: 'https://d33do7qe4w26qo.cloudfront.net/dicomweb',
        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'bulkdata,video,pdf',
      },
    },
    // {
    //   friendlyName: 'StaticWado default data',
    //   namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
    //   sourceName: 'dicomweb',
    //   configuration: {
    //     name: 'DCM4CHEE',
    //     wadoUriRoot: '/dicomweb',
    //     qidoRoot: '/dicomweb',
    //     wadoRoot: '/dicomweb',
    //     qidoSupportsIncludeField: false,
    //     supportsReject: false,
    //     imageRendering: 'wadors',
    //     thumbnailRendering: 'wadors',
    //     enableStudyLazyLoad: true,
    //     supportsFuzzyMatching: false,
    //     supportsWildcard: true,
    //     staticWado: true,
    //   },
    // },
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
  httpErrorHandler: error => {
    // This is 429 when rejected from the public idc sandbox too often.
    console.warn(error.status);

    // Could use services manager here to bring up a dialog/modal if needed.
    console.warn('test, navigate to https://ohif.org/');
  },
  hotkeys: [],
};
