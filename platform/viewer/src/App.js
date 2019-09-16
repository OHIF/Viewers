import { hot } from 'react-hot-loader/root';

import './config';

import {
  CommandsManager,
  ExtensionManager,
  HotkeysManager,
  utils,
} from '@ohif/core';
import React, { Component } from 'react';
import {
  getUserManagerForOpenIdConnectClient,
  initWebWorkers,
} from './utils/index.js';

import { I18nextProvider } from 'react-i18next';
import initCornerstoneTools from './initCornerstoneTools.js';

// ~~ EXTENSIONS
import { GenericViewerCommands, MeasurementsPanel } from './appExtensions';
import OHIFCornerstoneExtension from '@ohif/extension-cornerstone';
import OHIFStandaloneViewer from './OHIFStandaloneViewer';
import { OidcProvider } from 'redux-oidc';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { getActiveContexts } from './store/layout/selectors.js';
import i18n from '@ohif/i18n';
import setupTools from './setupTools.js';
import store from './store';

// Contexts
import WhiteLabellingContext from './context/WhiteLabellingContext';
import UserManagerContext from './context/UserManagerContext';
import AppContext from './context/AppContext';

// ~~~~ APP SETUP
initCornerstoneTools({
  globalToolSyncEnabled: true,
  showSVGCursors: true,
});

const commandsManagerConfig = {
  getAppState: () => store.getState(),
  getActiveContexts: () => getActiveContexts(store.getState()),
};

const commandsManager = new CommandsManager(commandsManagerConfig);
const hotkeysManager = new HotkeysManager(commandsManager);
const extensionManager = new ExtensionManager({ commandsManager });

// CornerstoneTools and labeling/measurements?
setupTools(store);
// ~~~~ END APP SETUP

// TODO[react] Use a provider when the whole tree is React
window.store = store;

class App extends Component {
  static propTypes = {
    routerBasename: PropTypes.string.isRequired,
    servers: PropTypes.object.isRequired,
    //
    oidc: PropTypes.array,
    whiteLabelling: PropTypes.object,
    extensions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
      })
    ),
  };

  static defaultProps = {
    whiteLabelling: {},
    oidc: [],
    extensions: [],
  };

  _appConfig;
  _userManager;

  constructor(props) {
    super(props);

    this._appConfig = props;
    const { servers, extensions, hotkeys, oidc } = props;

    this.initUserManager(oidc);
    _initExtensions(extensions, hotkeys);
    _initServers(servers);
    initWebWorkers();
  }

  render() {
    const userManager = this._userManager;
    const config = {
      appConfig: this._appConfig,
    };

    if (userManager) {
      return (
        <AppContext.Provider value={config}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <OidcProvider store={store} userManager={userManager}>
                <UserManagerContext.Provider value={userManager}>
                  <Router basename={this.props.routerBasename}>
                    <WhiteLabellingContext.Provider
                      value={this.props.whiteLabelling}
                    >
                      <OHIFStandaloneViewer userManager={userManager} />
                    </WhiteLabellingContext.Provider>
                  </Router>
                </UserManagerContext.Provider>
              </OidcProvider>
            </I18nextProvider>
          </Provider>
        </AppContext.Provider>
      );
    }

    return (
      <AppContext.Provider value={config}>
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <Router basename={this.props.routerBasename}>
              <WhiteLabellingContext.Provider value={this.props.whiteLabelling}>
                <OHIFStandaloneViewer />
              </WhiteLabellingContext.Provider>
            </Router>
          </I18nextProvider>
        </Provider>
      </AppContext.Provider>
    );
  }

  initUserManager(oidc) {
    if (oidc && !!oidc.length) {
      const firstOpenIdClient = this.props.oidc[0];

      const { protocol, host } = window.location;
      const { routerBasename } = this.props;
      const baseUri = `${protocol}//${host}${routerBasename}`;

      const redirect_uri = firstOpenIdClient.redirect_uri || '/callback';
      const silent_redirect_uri =
        firstOpenIdClient.silent_redirect_uri || '/silent-refresh.html';
      const post_logout_redirect_uri =
        firstOpenIdClient.post_logout_redirect_uri || '/';

      const openIdConnectConfiguration = Object.assign({}, firstOpenIdClient, {
        redirect_uri: _makeAbsoluteIfNecessary(redirect_uri, baseUri),
        silent_redirect_uri: _makeAbsoluteIfNecessary(
          silent_redirect_uri,
          baseUri
        ),
        post_logout_redirect_uri: _makeAbsoluteIfNecessary(
          post_logout_redirect_uri,
          baseUri
        ),
      });

      this._userManager = getUserManagerForOpenIdConnectClient(
        store,
        openIdConnectConfiguration
      );
    }
  }
}

/**
 * @param
 */
function _initExtensions(extensions, hotkeys) {
  const defaultExtensions = [
    GenericViewerCommands,
    MeasurementsPanel,
    OHIFCornerstoneExtension,
  ];
  const mergedExtensions = defaultExtensions.concat(extensions);
  extensionManager.registerExtensions(mergedExtensions);

  // Must run after extension commands are registered
  if (hotkeys) {
    hotkeysManager.setHotkeys(hotkeys, true);
  }
}

function _initServers(servers) {
  if (servers) {
    utils.addServers(servers, store);
  }
}

function _isAbsoluteUrl(url) {
  return url.includes('http://') || url.includes('https://');
}

function _makeAbsoluteIfNecessary(url, base_url) {
  if (_isAbsoluteUrl(url)) {
    return url;
  }

  // Make sure base_url and url are not duplicating slashes
  if (base_url[base_url.length - 1] === '/') {
    base_url = base_url.slice(0, base_url.length - 1);
  }

  return base_url + url;
}

// Only wrap/use hot if in dev
const ExportedApp = process.env.NODE_ENV === 'development' ? hot(App) : App;

export default ExportedApp;
export { commandsManager, extensionManager, hotkeysManager };
