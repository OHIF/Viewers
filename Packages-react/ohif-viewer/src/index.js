/**
 * Entry point index.js for development
 */

import App from './App.js';
import React from 'react';
import ReactDOM from 'react-dom';

export { App };

var rootUrl = 'http://localhost:5000';
var routerBasename = '/';
var props = {
  routerBasename: routerBasename,
  rootUrl: rootUrl
};

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

/* Example config without OIDC */
props.servers = {
  dicomWeb: [
    {
      name: 'DCM4CHEE',
      wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
      qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
      wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
      qidoSupportsIncludeField: true,
      imageRendering: 'wadors',
      thumbnailRendering: 'wadors',
      requestOptions: {
        requestFromBrowser: true
      }
    }
  ]
};

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
UI settings
Plugins
    - Custom tools / buttons
    - Custom Sidebar module thing
    - Custom Viewports
    - Custom Sop Class Interpreters
*/

/*"PUBLIC_SETTINGS": {
    "ui": {
      "studyListFunctionsEnabled": true,
      "leftSidebarOpen": false,
      "displaySetNavigationLoopOverSeries": false,
      "displaySetNavigationMultipleViewports": true,
      "autoPositionMeasurementsTextCallOuts": "TRLB"
    },
    "prefetch": {
      "order": "topdown",
      "displaySetCount": 1
    }
 */

/*

White labelling example

// Note that you can't write JSX here, so you can use the online JSX compiler:
// https://babeljs.io/repl/#?babili=false&browsers=&build=&builtIns=false&spec=false&loose=false&code_lz=GYVwdgxgLglg9mABACwKYBt1wBQEpEDeAUIogE6pQhlIA8AholPWQOaUC8ARAPoBG6emADWXchm5g4cAA6owqMoikVgiimTERBAZx0A5egFtU3NPQAmigLR8yQi2OSqzUKDIBcAei_2LMCHp0GCN6VhgwVgA6CDgjLgA-ElIU1LS02hDWRB0yCA4AcmQ3Tx8_AKCQsIjo2KMvAHcZa1iwKHkoLxAZLEsdLwAmAAYARgB2LxGRrwgyWTkLFrmZBetwMGNURYGomUiCxC8k9JOU2i96BIBuIgBfIiA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=react&prettier=false&targets=&version=6.26.0&envVersion=
*/
/*function RadicalImagingLogo() {
  return React.createElement(
    'a',
    {
      target: '_blank',
      rel: 'noopener noreferrer',
      className: 'header-brand',
      href: 'http://radicalimaging.com'
    },
    React.createElement('h5', {}, 'RADICAL IMAGING')
  );
}

props.whiteLabelling = {
  logoComponent: RadicalImagingLogo()
};*/

// Note: Run your build like this:
// REACT_APP_CONFIG=$(cat ../config-react/ccc.json) yarn start
//
// If you change the JSON config, you need to re-run the command!
const configString = process.env && process.env && process.env.REACT_APP_CONFIG;
if (configString) {
  const configJSON = JSON.parse(configString);
  if (configJSON.servers) {
    props.servers = configJSON.servers;
  }

  if (configJSON.oidc) {
    props.oidc = configJSON.oidc;
  }
}

var app = React.createElement(App, props, null);

ReactDOM.render(app, document.getElementById('root'));
