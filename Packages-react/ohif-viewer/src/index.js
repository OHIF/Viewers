/**
 * Entry point index.js for development
 */


import App from './App.js';
import React from 'react';
import ReactDOM from 'react-dom';

export { App };

var routerBasename = 'http://localhost:5000';
var props = {
  routerBasename: routerBasename
};

/*
Example config with OIDC
*/
// Uncomment the next two blocks, comment out the config without OIDC
// Try going to:
// http://localhost:5000/viewer/1.3.6.1.4.1.25403.345050719074.3824.20170126082328.1
// http://ohif-viewer-react.s3-website-us-east-1.amazonaws.com/viewer/1.3.6.1.4.1.25403.345050719074.3824.20170126082328.1
props.servers = {
  "dicomWeb": [{
      "name": "DCM4CHEE",
      "wadoUriRoot": "https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/wado",
      "qidoRoot": "https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/rs",
      "wadoRoot": "https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/rs",
      "qidoSupportsIncludeField": true,
      "imageRendering": "wadors",
      "thumbnailRendering": "wadors",
      "requestOptions": {
          "requestFromBrowser": true
      }
    }
  ]
};

props.oidc = [{
    "authServerUrl": "https://cancer.crowds-cure.org/auth/realms/dcm4che",
    "authRedirectUri": routerBasename + '/callback',
    "postLogoutRedirectUri": routerBasename + '/logout-redirect.html',
    "clientId": "crowds-cure-cancer",
    "responseType": "id_token token",
    "scope": "email profile openid",
    "revokeAccessTokenOnSignout": true,
    "extraQueryParams": {
      "kc_idp_hint": "crowds-cure-cancer-auth0-oidc",
      "client_id": "crowds-cure-cancer"
    }
}];

/* Example config without OIDC */
// Try going to:
// http://localhost:5000/viewer/1.3.6.1.4.1.14519.5.2.1.1706.4996.216859690032335293073513900362
/* props.servers = {
  dicomWeb: [
    {
      name: 'DCM4CHEE',
      wadoUriRoot: 'https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/wado',
      qidoRoot: 'https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/rs',
      wadoRoot: 'https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/rs',
      qidoSupportsIncludeField: true,
      imageRendering: 'wadors',
      thumbnailRendering: 'wadors',
      requestOptions: {
        requestFromBrowser: true,
        auth: 'cloud:healthcare'
      }
    }
  ]
}; */

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
function RadicalImagingLogo() {
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
};

// TODO: Why do we need to do this? Something is wrong with our rollup settings
//var Viewer = window.OHIFStandaloneViewer.App;
var app = React.createElement(App, props, null);

ReactDOM.render(app, document.getElementById('root'));
