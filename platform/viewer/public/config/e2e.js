window.config = {
  routerBasename: '/',
  showStudyList: true,
  servers: {
    dicomWeb: [
      {
        name: 'LocalStatic',
        wadoUriRoot: '/viewer-testdata',
        qidoRoot: '/viewer-testdata',
        wadoRoot: '/viewer-testdata',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        staticWado: true,
      },
    ],
  },
};
