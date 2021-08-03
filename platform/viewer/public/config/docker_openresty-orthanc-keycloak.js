window.config = {
  routerBasename: '/',
  showStudyList: true,
  servers: {
    // This is an array, but we'll only use the first entry for now
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
        // TODO: Remove tag after https://github.com/OHIF/ohif-core/pull/19 is merged and we bump version
        // requestOptions: {
        // undefined to use JWT + Bearer auth
        // auth: 'orthanc:orthanc',
        // },
      },
    ],
  },
  // This is an array, but we'll only use the first entry for now
  oidc: [
    {
      // ~ REQUIRED
      // Authorization Server URL
      authority: 'http://127.0.0.1/auth/realms/ohif',
      client_id: 'ohif-viewer',
      redirect_uri: 'http://127.0.0.1/callback', // `OHIFStandaloneViewer.js`
      // "Authorization Code Flow"
      // Resource: https://medium.com/@darutk/diagrams-of-all-the-openid-connect-flows-6968e3990660
      response_type: 'code',
      scope: 'openid', // email profile openid
      // ~ OPTIONAL
      post_logout_redirect_uri: '/logout-redirect.html',
    },
  ],
};
