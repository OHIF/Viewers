import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import PropTypes from 'prop-types';
import OHIF from 'ohif-core';
import './config';
import ui from './redux/ui.js';
import OHIFStandaloneViewer from './OHIFStandaloneViewer';
import OHIFCornerstoneViewportPlugin from './connectedComponents/OHIFCornerstoneViewportPlugin/OHIFCornerstoneViewportPlugin.js';
import WhiteLabellingContext from './WhiteLabellingContext';
import OHIFDicomPDFViewportPlugin from './connectedComponents/OHIFDicomPDFViewportPlugin/OHIFDicomPDFViewportPlugin.js';
import OHIFDicomPDFSopClassHandlerPlugin from './connectedComponents/OHIFDicomPDFViewportPlugin/OHIFDicomPDFSopClassHandlerPlugin.js';

import {
  loadUser,
  OidcProvider,
  createUserManager,
  reducer as oidcReducer
} from 'redux-oidc';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

//import Icons from "./images/icons.svg"

const Icons = '/icons.svg';

const reducers = OHIF.redux.reducers;
reducers.ui = ui;
reducers.oidc = oidcReducer;

const combined = combineReducers(reducers);

const store = createStore(combined);

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
  }
];

const buttonsAction = OHIF.redux.actions.setAvailableButtons(defaultButtons);

store.dispatch(buttonsAction);


const { plugins } = OHIF;
const { PLUGIN_TYPES } = plugins;

const cornerstonePluginAction = OHIF.redux.actions.addPlugin({
  id: 'cornerstone',
  type: 'viewport',
  component: OHIFCornerstoneViewportPlugin
});

const pdfPluginAction = OHIF.redux.actions.addPlugin({
  id: 'pdf',
  type: PLUGIN_TYPES.VIEWPORT,
  component: OHIFDicomPDFViewportPlugin
});

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

function handleServers(servers) {
  if (servers) {
    OHIF.utils.addServers(servers, store);
  }
}

function handleOIDC(oidc) {
  if (!oidc) {
    return;
  }

  const oidcClient = oidc[0];

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

  const userManager = createUserManager(settings);

  loadUser(store, userManager);

  return userManager;
}

function handleWebWorkerInit(basename) {
  const config = {
    maxWebWorkers: Math.max(navigator.hardwareConcurrency - 1, 1),
    startWebWorkersOnDemand: true,
    webWorkerPath: basename + '/cornerstoneWADOImageLoaderWebWorker.min.js',
    taskConfiguration: {
      decodeTask: {
        loadCodecsOnStartup: true,
        initializeCodecsOnStartup: false,
        codecsPath: basename + '/cornerstoneWADOImageLoaderCodecs.min.js',
        usePDFJS: false,
        strict: false
      }
    }
  };

  cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
}

class App extends Component {
  static propTypes = {
    servers: PropTypes.object,
    oidc: PropTypes.array,
    routerBasename: PropTypes.string
  };

  constructor(props) {
    super(props);

    this.userManager = handleOIDC(this.props.oidc);
    handleServers(this.props.servers);
    handleWebWorkerInit(this.props.routerBasename);
  }

  render() {
    const userManager = this.userManager;

    if (userManager) {
      return (
        <Provider store={store}>
          <OidcProvider store={store} userManager={userManager}>
            <BrowserRouter>
              <WhiteLabellingContext.Provider value={this.props.whiteLabelling}>
                <OHIFStandaloneViewer userManager={userManager} />
              </WhiteLabellingContext.Provider>
            </BrowserRouter>
          </OidcProvider>
        </Provider>
      );
    }

    return (
      <Provider store={store}>
        <BrowserRouter>
          <WhiteLabellingContext.Provider value={this.props.whiteLabelling}>
            <OHIFStandaloneViewer />
          </WhiteLabellingContext.Provider>
        </BrowserRouter>
      </Provider>
    );
  }
}

export default App;
