window.config = {
  routerBasename: '/',
  extensions: [],
  showStudyList: true,
  servers: {
    dicomWeb: [
      {
        name: 'dicomweb_server',
        wadoUriRoot: 'http://localhost:5985',
        qidoRoot: 'http://localhost:5985',
        wadoRoot: 'http://localhost:5985',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadouri',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
      },
    ],
  },
};
