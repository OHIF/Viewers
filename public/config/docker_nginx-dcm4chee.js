window.config = {
  // default: '/'
  routerBasename: '/',
  // default: ''
  relativeWebWorkerScriptsPath: '',
  servers: {
    dicomWeb: [
      {
        name: 'DCM4CHEE',
        wadoUriRoot: 'http://arc:8080/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'http://arc:8080/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'http://arc:8080/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        requestOptions: {
          requestFromBrowser: true,
          auth: 'admin:admin',
        },
      },
    ],
  },
}
