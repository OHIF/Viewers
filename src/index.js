/**
 * Entry point for development and production PWA builds.
 * Packaged (NPM) builds go through `index_publish.js`
 */
import App from './App.js';
import React from 'react';
import ReactDOM from 'react-dom';

export { App };

window.config = window.config || {};
const applicationDefaults = {
  routerBasename: '/',
};
const applicationProps = Object.assign({}, applicationDefaults, window.config);
const app = React.createElement(App, applicationProps, null);

ReactDOM.render(app, document.getElementById('root'));

/*
Example config with OIDC
*/
// Uncomment the next two blocks, comment out the config without OIDC
// Try going to:
// http://localhost:5000/viewer/1.2.276.0.7230010.3.1.2.0.94237.1537373823.634387 //PDF
// http://localhost:5000/viewer/1.3.6.1.4.1.25403.345050719074.3824.20170126082328.1
// http://ohif-viewer-react.s3-website-us-east-1.amazonaws.com/viewer/1.3.6.1.4.1.25403.345050719074.3824.20170126082328.1
/*props.servers = {
  dicomWeb: [
    {
      name: 'DCM4CHEE',
      wadoUriRoot:
        'https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/wado',
      qidoRoot: 'https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/rs',
      wadoRoot: 'https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/rs',
      qidoSupportsIncludeField: true,
      imageRendering: 'wadors',
      thumbnailRendering: 'wadors',
      requestOptions: {
        requestFromBrowser: true
      }
    }
  ]
};

props.oidc = [
  {
    authServerUrl: 'https://cancer.crowds-cure.org/auth/realms/dcm4che',
    authRedirectUri: rootUrl + '/callback',
    postLogoutRedirectUri: rootUrl + '/logout-redirect.html',
    clientId: 'crowds-cure-cancer',
    responseType: 'id_token token',
    scope: 'email profile openid',
    revokeAccessTokenOnSignout: true,
    extraQueryParams: {
      kc_idp_hint: 'crowds-cure-cancer-auth0-oidc',
      client_id: 'crowds-cure-cancer'
    }
  }
];*/

/* props.servers = {
  dicomWeb: [
    {
      name: 'DCM4CHEE',
      wadoUriRoot:
        'https://k8s-testing.ohif.org/dcm4chee-arc/aets/DCM4CHEE/wado',
      qidoRoot: 'https://k8s-testing.ohif.org/dcm4chee-arc/aets/DCM4CHEE/rs',
      wadoRoot: 'https://k8s-testing.ohif.org/dcm4chee-arc/aets/DCM4CHEE/rs',
      qidoSupportsIncludeField: true,
      imageRendering: 'wadors',
      thumbnailRendering: 'wadors',
      requestOptions: {
        requestFromBrowser: true
      }
    }
  ]
};

props.oidc = [
  {
    authServerUrl: 'https://k8s-testing.ohif.org/auth/realms/dcm4che',
    authRedirectUri: rootUrl + '/callback',
    postLogoutRedirectUri: rootUrl + '/logout-redirect.html',
    clientId: 'ohif-viewer',
    responseType: 'id_token token',
    scope: 'email profile openid',
    revokeAccessTokenOnSignout: true
  }
]; */

/*props.servers = {
  "dicomWeb": [
    {
      "name": "DCM4CHEE",
      "wadoUriRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/wado",
      "qidoRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs",
      "wadoRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs",
      "qidoSupportsIncludeField": true,
      "imageRendering": "wadors",
      "thumbnailRendering": "wadors",
      "requestOptions": {
        "requestFromBrowser": true,
        "auth": "admin:admin"
      }
    }
  ]
};*/

/*
/*"PUBLIC_SETTINGS": {
    "ui": {
      "studyListFunctionsEnabled": true,
      "displaySetNavigationLoopOverSeries": false,
      "displaySetNavigationMultipleViewports": true,
      "autoPositionMeasurementsTextCallOuts": "TRLB"
    },
    "prefetch": {
      "order": "topdown",
      "displaySetCount": 1
    }
 */
