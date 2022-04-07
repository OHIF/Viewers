window.config = {
  routerBasename: '/',
  showStudyList: true,
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
        supportsFuzzyMatching: true,
      },
    ],
  },
  i18n: {
    LOCIZE_PROJECTID: 'a8da3f9a-e467-4dd6-af33-474d582a0294',
    LOCIZE_API_KEY: null, // Developers can use this to do in-context editing. DO NOT COMMIT THIS KEY!
    USE_LOCIZE: false,
  },
};
