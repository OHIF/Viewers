window.config = {
  routerBasename: '/',
  showStudyList: true,
  servers: {
    dicomWeb: [
      {
        name: 'Orthanc',
        wadoUriRoot: '/wado',
        qidoRoot: '/dicom-web',
        wadoRoot: '/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        requestOptions: {
          auth: 'alice:alicePassword',
          logRequests: true,
          logResponses: false,
          logTiming: true,
        },
      },
    ],
  },
  extensions: [
  ]
};
