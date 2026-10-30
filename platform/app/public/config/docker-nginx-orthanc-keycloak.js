/** @type {AppTypes.Config} */
window.config = {
  routerBasename: '/ohif-viewer',
  extensions: [],
  modes: [],
  customizationService: {},
  showStudyList: true,
  maxNumberOfWebWorkers: 3,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  // Lossy downsampling is off here. To turn it on, uncomment the line below.
  // Cornerstone3D defaults: final false, interactive true, interleavedLoading true.
  // `final` reduces a volume texture to fit the GPU settings preset. Select the
  // preset with the `cornerstone.gpuSettingsPreset` customization: auto, low-tablet,
  // low, medium, high, high-texture-4096. These options are not fully safe on every
  // device: a texture that is too large can lose the WebGL context, and then the
  // user must reload. See configurationFiles.md and specificCustomizations.md.
  // lossyDownsampling: { final: true, interactive: true, interleavedLoading: true },
  groupEnabledModesFirst: true,
  maxNumRequests: {
    interaction: 100,
    thumbnail: 5,
    prefetch: 25,
  },
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Local Orthanc',
        name: 'Orthanc',
        wadoUriRoot: 'http://127.0.0.1/pacs',
        qidoRoot: 'http://127.0.0.1/pacs',
        wadoRoot: 'http://127.0.0.1/pacs',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'bulkdata,video',
        // whether the data source should use retrieveBulkData to grab metadata,
        // and in case of relative path, what would it be relative to, options
        // are in the series level or study level (some servers like series some study)
        bulkDataURI: {
          enabled: true,
        },
        omitQuotationForMultipartRequest: true,
      },
    },
  ],
  httpErrorHandler: error => {
    console.warn(error.status);
    console.warn('test, navigate to https://ohif.org/');
  },
};
