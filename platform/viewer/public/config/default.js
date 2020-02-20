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
  // Extensions should be able to suggest default values for these?
  // Or we can require that these be explicitly set
  hotkeys: [],
  cornerstoneExtensionConfig: {},
};
