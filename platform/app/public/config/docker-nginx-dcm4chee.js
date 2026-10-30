/** @type {AppTypes.Config} */
window.config = {
  routerBasename: null,
  showStudyList: true,
  extensions: [],
  modes: [],
  // below flag is for performance reasons, but it might not work for all servers
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
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Dcm4chee Server',
        name: 'Dcm4chee',
        wadoUriRoot: '/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: '/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: '/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        dicomUploadEnabled: true,
        omitQuotationForMultipartRequest: true,
      },
    },
  ],
};
