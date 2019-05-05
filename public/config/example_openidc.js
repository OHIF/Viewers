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
        // wadoUriRoot: 'http://localhost:8899/wado',
        // qidoRoot: 'http://localhost:8899/dicom-web',
        // wadoRoot: 'http://localhost:8899/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        requestOptions: {
          auth: 'orthanc:orthanc',
          logRequests: true,
          logResponses: false,
          logTiming: true,
        },
      },
    ],
  },
  oidc: [
    {
      authServerUrl: 'http://127.0.0.1/auth/realms/master',
      // It looks like we have this route hardcoded in `OHIFStandaloneViewer.js`
      authRedirectUri: '/callback', // backup: /studylist\
      // Also hardcoded?
      postLogoutRedirectUri: '/logout-redirect.html',
      responseType: 'id_token',
      scope: 'openid',
      clientId: 'pacs',
    },
    // ccc.js
    // {
    //   authRedirectUri: "http://localhost:5000/callback",
    //   postLogoutRedirectUri: "http://localhost:5000/logout-redirect.html",
    //   responseType: "id_token token",
    //   scope: "email profile openid",
    //   revokeAccessTokenOnSignout: true,
    //   extraQueryParams: {
    //     kc_idp_hint: "crowds-cure-cancer-auth0-oidc",
    //     client_id: "crowds-cure-cancer"
    //   }
    // }
  ],
}
