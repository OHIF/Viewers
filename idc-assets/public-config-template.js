window.config = {
  routerBasename: '/',
  showStudyList: true,
  enableGoogleCloudAdapter: true,
  studyListFunctionsEnabled: true,
  filterQueryParam: true,
  disableMeasurementPanel: true,
  splitQueryParameterCalls: true,
  servers: {
    // This is an array, but we'll only use the first entry for now
    dicomWeb: [],
  },
  // This is an array, but we'll only use the first entry for now
  oidc: [
    {
      // ~ REQUIRED
      // Authorization Server URL
      authority: 'https://accounts.google.com',
      client_id: '_P___IDC__PUBLIC__CLIENT__ID___Q_',
      redirect_uri: '/callback', // `OHIFStandaloneViewer.js`
      response_type: 'id_token token',
      scope: 'email profile openid https://www.googleapis.com/auth/cloudplatformprojects.readonly https://www.googleapis.com/auth/cloud-healthcare', // email profile openid
      // ~ OPTIONAL
      post_logout_redirect_uri: '/logout-redirect.html',
      revoke_uri: 'https://accounts.google.com/o/oauth2/revoke?token=',
      automaticSilentRenew: true,
      revokeAccessTokenOnSignout: true,
    },
  ],
  hotkeys: [{
    commandName: 'downloadAndZip',
    label: 'Download',
    keys: ['d']
  }],
}