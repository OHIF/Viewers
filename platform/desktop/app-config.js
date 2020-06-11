// TODO: wadors still appears to display images incorrectly
// need to investigate what is wrong with what
// dicomweb-server is sending
window.config = {
  routerBasename: './',
  servers: {
    dicomWeb: [
      {
        name: 'dicomweb-server',
        wadoUriRoot: 'http://localhost:5985',
        qidoRoot: 'http://localhost:5985',
        wadoRoot: 'http://localhost:5985',
        imageRendering: 'wadouri',
        thumbnailRendering: 'wadouri',
      },
    ],
  },
  studyListFunctionsEnabled: true,
};
