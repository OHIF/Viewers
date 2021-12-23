window.config = {
  routerBasename: '/',
  showStudyList: true,
  servers: {
    dicomWeb: [
      {
        name: 'LocalStatic',
        wadoUriRoot: 'http://localhost:5000/',
        qidoRoot: 'http://localhost:5000',
        wadoRoot: 'http://localhost:5000/',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'thumbnail',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        staticWado: true,
      },
    ],
  },
};
