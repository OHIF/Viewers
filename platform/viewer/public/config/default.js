window.config = {
  // default: '/'
  routerBasename: '/',
  whiteLabelling: {},
  extensions: [],
  showStudyList: true,
  filterQueryParam: false,
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
        enableStudyLazyLoad: true,
      },
    ],
  },
  // useDefaultHotkeys: false,
  hotkeys: [
    // // disable a coomand
    // { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: [] },
    // // or override it
    // { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: ['t'] },
    // // or only change the label
    // { commandName: 'rotateViewportCW', label: 'Right Rotate' },
    // // or only make it un-discoverable
    // { commandName: 'rotateViewportCW', label: null },
    // // Setup a hotkey for which there is not default
    // { commandName: 'enableCrosshairsTool', label: 'Crosshair', keys: ['c'] },
    // // Or jsut make it discoverable
    // { commandName: 'enableCrosshairsTool', label: 'Crosshair', keys: [] },
  ],
  cornerstoneExtensionConfig: {},
};
