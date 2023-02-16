window.config = {
  // Activate the new HP mode....
  isNewHP: true,

  routerBasename: '/',
  customizationService: [
    '@ohif/extension-default.customizationModule.datasources',
    {
      id: 'class:StudyBrowser',
      true: 'black',
      false: 'default',
    },
  ],
  extensions: [],
  modes: ['@ohif/mode-test'],
  showStudyList: true,
  maxNumberOfWebWorkers: 4,
  // below flag is for performance reasons, but it might not work for all servers
  omitQuotationForMultipartRequest: true,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  // filterQueryParam: false,
  dataSources: [
    {
      friendlyName: 'Static WADO Local Data',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'default',
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
      friendlyName: 'AWS S3 OHIF',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'aws',
      configuration: {
        name: 'aws',
        qidoRoot: 'https://dd32w2rfebxel.cloudfront.net/dicomweb',
        wadoRoot: 'https://dd32w2rfebxel.cloudfront.net/dicomweb',
        qidoSupportsIncludeField: false,
        supportsReject: false,
        supportsStow: false,
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
      friendlyName: 'E2E Test Data',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'e2e',
      configuration: {
        name: 'DCM4CHEE',
        wadoUriRoot: '/viewer-testdata',
        qidoRoot: '/viewer-testdata',
        wadoRoot: '/viewer-testdata',
        qidoSupportsIncludeField: false,
        supportsReject: false,
        supportsStow: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'video,thumbnail,pdf',
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
  httpErrorHandler: error => {
    // This is 429 when rejected from the public idc sandbox too often.
    console.warn(error.status);

    // Could use services manager here to bring up a dialog/modal if needed.
    console.warn('test, navigate to https://ohif.org/');
  },
  defaultDataSourceName: 'default',

  // Only list the unique hotkeys
  hotkeys: [
    {
      commandName: 'nextStage',
      context: 'DEFAULT',
      label: 'Next Stage',
      keys: ['end'],
    },
    {
      commandName: 'previousStage',
      context: 'DEFAULT',
      label: 'Previous Stage',
      keys: ['home'],
    },
  ],
};
