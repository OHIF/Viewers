import React from "react";
import ReactDOM from 'react-dom';
import { BrowserRouter } from "react-router-dom";
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { loadUser, reducer as oidcReducer, OidcProvider, createUserManager } from 'redux-oidc';
import OHIF from 'ohif-core';
import './config';
import ui from './redux/ui.js';
import App from './App.js';

import OHIFCornerstoneViewportPlugin from "./connectedComponents/OHIFCornerstoneViewportPlugin/OHIFCornerstoneViewportPlugin.js";
//import ConnectedExampleViewportPlugin from './components/ConnectedExampleViewportPlugin.js';
//import OHIFVTKViewportPlugin from './connectedComponents/OHIFVTKViewportPlugin/OHIFVTKViewportPlugin.js';
import OHIFDicomPDFViewportPlugin from './connectedComponents/OHIFDicomPDFViewportPlugin/OHIFDicomPDFViewportPlugin.js';
import OHIFDicomPDFSopClassHandlerPlugin from './connectedComponents/OHIFDicomPDFViewportPlugin/OHIFDicomPDFSopClassHandlerPlugin.js';

const reducers = OHIF.redux.reducers;
reducers.ui = ui;
reducers.oidc = oidcReducer;

const Icons = '/icons.svg';
const combined = combineReducers(reducers)
const store = createStore(combined);

// Note: Run your build like this:
// REACT_APP_CONFIG=$(cat ../config-react/ccc.json) yarn start
//
// If you change the JSON config, you need to re-run the command!
let config;
if (process.env.REACT_APP_CONFIG) {
  config = JSON.parse(process.env.REACT_APP_CONFIG);
}

let userManager;
if (config && config.oidc) {
  const oidcClient = config.oidc[0];

  const settings = {
    authority: oidcClient.authServerUrl,
    client_id: oidcClient.clientId,
    redirect_uri: oidcClient.authRedirectUri,
    silent_redirect_uri: '/silent-refresh.html',
    post_logout_redirect_uri: oidcClient.postLogoutRedirectUri,
    response_type: oidcClient.responseType,
    scope: 'email profile openid', // Note: Request must have scope 'openid' to be considered an OpenID Connect request
    automaticSilentRenew: true,
    revokeAccessTokenOnSignout: true,
    filterProtocolClaims: true,
    loadUserInfo: true,
    extraQueryParams: oidcClient.extraQueryParams
  };

  userManager = createUserManager(settings);

  loadUser(store, userManager);
}

if (config && config.servers) {
  OHIF.utils.addServers(config.servers, store);
}

const defaultButtons = [
    {
        command: 'StackScroll',
        type: 'tool',
        text: 'Stack Scroll',
        svgUrl: `${Icons}#icon-tools-stack-scroll`,
        active: false
    },
    {
        command: 'Zoom',
        type: 'tool',
        text: 'Zoom',
        svgUrl: `${Icons}#icon-tools-zoom`,
        active: false
    },
    {
        command: 'Wwwc',
        type: 'tool',
        text: 'Levels',
        svgUrl: `${Icons}#icon-tools-levels`,
        active: true
    },
    {
        command: 'Pan',
        type: 'tool',
        text: 'Pan',
        svgUrl: `${Icons}#icon-tools-pan`,
        active: false
    },
    {
        command: 'Length',
        type: 'tool',
        text: 'Length',
        svgUrl: `${Icons}#icon-tools-measure-temp`,
        active: false
    },
    /*{
        command: 'Annotate',
        type: 'tool',
        text: 'Annotate',
        svgUrl: `${Icons}#icon-tools-measure-non-target`,
        active: false
    },*/
    {
        command: 'Angle',
        type: 'tool',
        text: 'Angle',
        iconClasses: 'fa fa-angle-left',
        active: false
    },
    {
        command: 'Bidirectional',
        type: 'tool',
        text: 'Bidirectional',
        svgUrl: `${Icons}#icon-tools-measure-target`,
        active: false
    },
    {
        command: 'reset',
        type: 'command',
        text: 'Reset',
        svgUrl: `${Icons}#icon-tools-reset`,
        active: false
    },
];

const buttonsAction = OHIF.redux.actions.setAvailableButtons(defaultButtons);

store.dispatch(buttonsAction);

const { plugins } = OHIF;
const { PLUGIN_TYPES } = plugins;

// Uncomment this and comment the Cornerstone version to see how the
// example plugin works
/*const pluginAction = OHIF.redux.actions.addPlugin({
  id: 'example',
  type: PLUGIN_TYPES.VIEWPORT,
  component: ConnectedExampleViewportPlugin
});*/

const cornerstonePluginAction = OHIF.redux.actions.addPlugin({
  id: 'cornerstone',
  type: PLUGIN_TYPES.VIEWPORT,
  component: OHIFCornerstoneViewportPlugin
});

/*const pluginAction = OHIF.redux.actions.addPlugin({
  id: 'vtk',
  type: PLUGIN_TYPES.VIEWPORT,
  component: OHIFVTKViewportPlugin
});*/

const pdfPluginAction = OHIF.redux.actions.addPlugin({
  id: 'pdf',
  type: PLUGIN_TYPES.VIEWPORT,
  component: OHIFDicomPDFViewportPlugin
});

const servers = {
    dicomWeb: [
        {
            "name": "DCM4CHEE",
            //"wadoUriRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/wado",
            //"qidoRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs",
            //"wadoRoot": "http://localhost:8080/dcm4chee-arc/aets/DCM4CHEE/rs",
            "wadoUriRoot": "https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/wado",
            "qidoRoot": "https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/rs",
            "wadoRoot": "https://dcm4che.ohif.club/dcm4chee-arc/aets/DCM4CHEE/rs",
            // "wadoUriRoot": "https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/wado",
            // "qidoRoot": "https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/rs",
            // "wadoRoot": "https://cancer.crowds-cure.org/dcm4chee-arc/aets/DCM4CHEE/rs",
            "qidoSupportsIncludeField": true,
            "imageRendering": "wadors",
            "thumbnailRendering": "wadors",
            "requestOptions": {
                "requestFromBrowser": true,
                "logRequests": true,
                "logResponses": false,
                "logTiming": true,
                //"auth": "admin:admin"
                //"auth": "cloud:healthcare"
            }
        }
    ]
};

OHIF.utils.addServers(servers, store);

const pdfPluginActionSopClass = OHIF.redux.actions.addPlugin({
  id: 'pdf_sopClassHandler',
  type: PLUGIN_TYPES.SOP_CLASS_HANDLER,
  component: OHIFDicomPDFSopClassHandlerPlugin
});

store.dispatch(cornerstonePluginAction);
store.dispatch(pdfPluginAction);
store.dispatch(pdfPluginActionSopClass);

// TODO[react] Use a provider when the whole tree is React
window.store = store;

if (userManager) {
  ReactDOM.render(
    <Provider store={store}>
      <OidcProvider store={store} userManager={userManager}>
        <BrowserRouter>
          <App userManager={userManager}/>
        </BrowserRouter>
      </OidcProvider>
    </Provider>,
    document.getElementById('root')
  );
} else {
  ReactDOM.render(
    <Provider store={store}>
        <BrowserRouter>
          <App/>
        </BrowserRouter>
    </Provider>,
    document.getElementById('root')
  );
}

