window.config = {
  // default: '/'
  routerBasename: '/',
  // default: ''
  relativeWebWorkerScriptsPath: '',
  servers: {
    dicomWeb: [
      {
        name: 'Orthanc',
        wadoUriRoot: 'http://127.0.0.1/pacs/wado',
        qidoRoot: 'http://127.0.0.1/pacs/dicom-web',
        wadoRoot: 'http://127.0.0.1/pacs/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        // REQUIRED TAG:
        // https://github.com/OHIF/ohif-core/blob/59e1e04b92be24aee5d4402445cb3dcedb746995/src/studies/retrieveStudyMetadata.js#L54
        requestOptions: {
          //   auth: 'orthanc:orthanc', // undefined to use JWT + Bearer auth
          requestFromBrowser: true,
          //   logRequests: true,
          //   logResponses: false,
          //   logTiming: true,
        },
      },
    ],
  },
  oidc: [
    {
      // ~ REQUIRED
      // Authorization Server URL
      authority: 'http://127.0.0.1/auth/realms/master',
      client_id: 'ohif-viewer',
      redirect_uri: '/callback', // `OHIFStandaloneViewer.js`
      response_type: 'id_token',
      scope: 'openid', // email profile openid
      // ~ OPTIONAL
      post_logout_redirect_uri: '/logout-redirect.html',
    },
  ],
}
