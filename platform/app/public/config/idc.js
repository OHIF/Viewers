/** @type {AppTypes.Config} */
window.config = {
  routerBasename: '/',
  enableGoogleCloudAdapter: true,
  // below flag is for performance reasons, but it might not work for all servers
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
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
      client_id: '723928408739-k9k9r3i44j32rhu69vlnibipmmk9i57p.apps.googleusercontent.com',
      redirect_uri: '/callback', // `OHIFStandaloneViewer.js`
      response_type: 'id_token token',
      scope:
        'email profile openid https://www.googleapis.com/auth/cloudplatformprojects.readonly https://www.googleapis.com/auth/cloud-healthcare', // email profile openid
      // ~ OPTIONAL
      post_logout_redirect_uri: '/logout-redirect.html',
      revoke_uri: 'https://accounts.google.com/o/oauth2/revoke?token=',
      automaticSilentRenew: true,
      revokeAccessTokenOnSignout: true,
    },
  ],
  studyListFunctionsEnabled: true,
};

// window.config = function(props) {
//   var servicesManager = props.servicesManager;

//   return {
//     routerBasename: '/',
//     enableGoogleCloudAdapter: true,
//     enableGoogleCloudAdapterUI: false,
//     showStudyList: true,
//     httpErrorHandler: error => {
//       // This is 429 when rejected from the public idc sandbox too often.
//       console.warn(error.status);

//       // Could use services manager here to bring up a dialog/modal if needed.
//       console.warn('test, navigate to https://ohif.org/');
//       window.location = 'https://ohif.org/';
//     },
//     healthcareApiEndpoint: 'https://idc-sandbox-002.appspot.com/v1beta1',
//   };
// };
