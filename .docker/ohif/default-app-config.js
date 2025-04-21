window.config = {
  routerBasename: "/ohif",
  logo: {
    // Puedes usar una ruta relativa a la carpeta public
    url: "/my-logo.png",
    topLeft: true, // o false, dependiendo de dónde lo quieras
  },
  extensions: [],
  modes: [],
  customizationService: {
    // Shows a custom route -access via http://localhost:3000/custom
    // helloPage: '@ohif/extension-default.customizationModule.helloPage',
  },
  showStudyList: true,
  // some windows systems have issues with more than 3 web workers
  maxNumberOfWebWorkers: 3,
  // below flag is for performance reasons, but it might not work for all servers
  omitQuotationForMultipartRequest: true,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    // Prefetch number is dependent on the http protocol. For http 2 or
    // above, the number of requests can be go a lot higher.
    prefetch: 25,
  },
  // filterQueryParam: false,
  dataSources: [
    {
      friendlyName: "Orthanc local",
      namespace: "@ohif/extension-default.dataSourcesModule.dicomweb",
      sourceName: "dicomweb",
      configuration: {
        name: "orthanc",
        wadoUriRoot: "/orthanc-container/dicom-web",
        qidoRoot: "/orthanc-container/dicom-web",
        wadoRoot: "/orthanc-container/dicom-web",
        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: "wadors",
        thumbnailRendering: "wadors",
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: "bulkdata",
        acceptHeader: [
          "multipart/related; type=application/octet-stream; transfer-syntax=*",
        ],
        bulkDataURI: {
          // note: this won't be required anymore once this issue is solved and the associated patch is released: https://github.com/OHIF/Viewers/issues/4256
          enabled: true,
        },
      },
    },
  ],
  httpErrorHandler: (error) => {
    // This is 429 when rejected from the public idc sandbox too often.
    console.warn(error.status);
  },
  defaultDataSourceName: "dicomweb",
  hotkeys: [
    {
      commandName: "incrementActiveViewport",
      label: "Next Viewport",
      keys: ["right"],
    },
    {
      commandName: "decrementActiveViewport",
      label: "Previous Viewport",
      keys: ["left"],
    },
    { commandName: "rotateViewportCW", label: "Rotate Right", keys: ["r"] },
    { commandName: "rotateViewportCCW", label: "Rotate Left", keys: ["l"] },
    { commandName: "invertViewport", label: "Invert", keys: ["i"] },
    {
      commandName: "flipViewportHorizontal",
      label: "Flip Horizontally",
      keys: ["h"],
    },
    {
      commandName: "flipViewportVertical",
      label: "Flip Vertically",
      keys: ["v"],
    },
    { commandName: "scaleUpViewport", label: "Zoom In", keys: ["+"] },
    { commandName: "scaleDownViewport", label: "Zoom Out", keys: ["-"] },
    { commandName: "fitViewportToWindow", label: "Zoom to Fit", keys: ["="] },
    { commandName: "resetViewport", label: "Reset", keys: ["space"] },
    { commandName: "nextImage", label: "Next Image", keys: ["down"] },
    { commandName: "previousImage", label: "Previous Image", keys: ["up"] },
    // {
    //   commandName: 'previousViewportDisplaySet',
    //   label: 'Previous Series',
    //   keys: ['pagedown'],
    // },
    // {
    //   commandName: 'nextViewportDisplaySet',
    //   label: 'Next Series',
    //   keys: ['pageup'],
    // },
    {
      commandName: "setToolActive",
      commandOptions: { toolName: "Zoom" },
      label: "Zoom",
      keys: ["z"],
    },
    // ~ Window level presets
    {
      commandName: "windowLevelPreset1",
      label: "W/L Preset 1",
      keys: ["1"],
    },
    {
      commandName: "windowLevelPreset2",
      label: "W/L Preset 2",
      keys: ["2"],
    },
    {
      commandName: "windowLevelPreset3",
      label: "W/L Preset 3",
      keys: ["3"],
    },
    {
      commandName: "windowLevelPreset4",
      label: "W/L Preset 4",
      keys: ["4"],
    },
    {
      commandName: "windowLevelPreset5",
      label: "W/L Preset 5",
      keys: ["5"],
    },
    {
      commandName: "windowLevelPreset6",
      label: "W/L Preset 6",
      keys: ["6"],
    },
    {
      commandName: "windowLevelPreset7",
      label: "W/L Preset 7",
      keys: ["7"],
    },
    {
      commandName: "windowLevelPreset8",
      label: "W/L Preset 8",
      keys: ["8"],
    },
    {
      commandName: "windowLevelPreset9",
      label: "W/L Preset 9",
      keys: ["9"],
    },
  ],
};
