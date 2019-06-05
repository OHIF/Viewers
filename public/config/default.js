window.config = {
  // default: '/'
  routerBasename: '/',
  // default: ''
  relativeWebWorkerScriptsPath: '',
  servers: {
    dicomWeb: [
      {
        name: 'DCM4CHEE',
        wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        requestOptions: {
          requestFromBrowser: true,
        },
      },
    ],
  },
  //
  userPreferences: [
    {
      order: 0,
      title: 'preference page title',
      items: [
        {
          order: 0,
          label: 'Scale Viewport Up',
          command: 'scaleUpViewport',
        },
      ],
    },
  ],
  //
  hotkeys: {
    // ~ Global
    incrementActiveViewport: ['right'],
    decrementActiveViewport: ['left'],
    // Supported Keys: https://craig.is/killing/mice
    // ~ Cornerstone Extension
    rotateViewportCW: ['r'],
    rotateViewportCCW: ['l'],
    invertViewport: ['i'],
    flipViewportVertical: ['h'],
    flipViewportHorizontal: ['v'],
    scaleUpViewport: ['+'],
    scaleDownViewport: ['-'],
    fitViewportToWindow: ['='],
    resetViewport: ['space'],
    // clearAnnotations
    // nextImage
    // previousImage
    // firstImage
    // lastImage
    nextViewportDisplaySet: ['pageup'],
    previousViewportDisplaySet: ['pagedown'],
    // ~ Cornerstone Tools
    setZoomTool: ['z'],
  },
};
