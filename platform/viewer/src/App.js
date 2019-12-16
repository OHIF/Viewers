import React, { Component } from 'react';
import { OidcProvider } from 'redux-oidc';
import { I18nextProvider } from 'react-i18next';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';

import OHIFCornerstoneExtension from '@ohif/extension-cornerstone';

import {
  SnackbarProvider,
  ModalProvider,
  DialogProvider,
  OHIFModal,
} from '@ohif/ui';

import {
  CommandsManager,
  ExtensionManager,
  ServicesManager,
  HotkeysManager,
  UINotificationService,
  UIModalService,
  UIDialogService,
  utils,
  redux as reduxOHIF,
} from '@ohif/core';

import i18n from '@ohif/i18n';

// TODO: This should not be here
import './config';

/** Utils */
import {
  getUserManagerForOpenIdConnectClient,
  initWebWorkers,
} from './utils/index.js';

/** Extensions */
import { GenericViewerCommands, MeasurementsPanel } from './appExtensions';

/** Viewer */
import OHIFStandaloneViewer from './OHIFStandaloneViewer';

/** Store */
import { getActiveContexts } from './store/layout/selectors.js';
import store from './store';

/** Contexts */
import WhiteLabellingContext from './context/WhiteLabellingContext';
import UserManagerContext from './context/UserManagerContext';
import AppContext from './context/AppContext';
const { setUserPreferences } = reduxOHIF.actions;

/** ~~~~~~~~~~~~~ Application Setup */
const commandsManagerConfig = {
  getAppState: () => store.getState(),
  getActiveContexts: () => getActiveContexts(store.getState()),
};

/** Managers */
const commandsManager = new CommandsManager(commandsManagerConfig);
const hotkeysManager = new HotkeysManager(commandsManager);
const servicesManager = new ServicesManager();
let extensionManager;
/** ~~~~~~~~~~~~~ End Application Setup */

// TODO[react] Use a provider when the whole tree is React
window.store = store;

class App extends Component {
  static propTypes = {
    config: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({
        routerBasename: PropTypes.string.isRequired,
        oidc: PropTypes.array,
        whiteLabelling: PropTypes.object,
        extensions: PropTypes.array,
      }),
    ]).isRequired,
    defaultExtensions: PropTypes.array,
  };

  static defaultProps = {
    config: {
      whiteLabelling: {},
      oidc: [],
      extensions: [],
    },
    defaultExtensions: [],
  };

  _appConfig;
  _userManager;

  constructor(props) {
    super(props);

    const { config, defaultExtensions } = props;

    const appDefaultConfig = {
      cornerstoneExtensionConfig: {},
      extensions: [],
      routerBasename: '/',
      whiteLabelling: {},
    };

    this._appConfig = {
      ...appDefaultConfig,
      ...(typeof config === 'function' ? config({ servicesManager }) : config),
    };

    const {
      servers,
      hotkeys,
      cornerstoneExtensionConfig,
      extensions,
      oidc,
    } = this._appConfig;

    this.initUserManager(oidc);
    _initServices([UINotificationService, UIModalService, UIDialogService]);
    _initExtensions(
      [...defaultExtensions, ...extensions],
      cornerstoneExtensionConfig,
      this._appConfig
    );

    /*
     * Must run after extension commands are registered
     * if there is no hotkeys from localStorage set up from config.
     */
    _initHotkeys(hotkeys);
    _initServers(servers);
    initWebWorkers();
  }

  render() {
    const { whiteLabelling, routerBasename } = this._appConfig;
    const {
      UINotificationService,
      UIDialogService,
      UIModalService,
    } = servicesManager.services;

    if (this._userManager) {
      return (
        <AppContext.Provider value={{ appConfig: this._appConfig }}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <OidcProvider store={store} userManager={this._userManager}>
                <UserManagerContext.Provider value={this._userManager}>
                  <Router basename={routerBasename}>
                    <WhiteLabellingContext.Provider value={whiteLabelling}>
                      <SnackbarProvider service={UINotificationService}>
                        <DialogProvider service={UIDialogService}>
                          <ModalProvider
                            modal={OHIFModal}
                            service={UIModalService}
                          >
                            <OHIFStandaloneViewer
                              userManager={this._userManager}
                            />
                          </ModalProvider>
                        </DialogProvider>
                      </SnackbarProvider>
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
      <AppContext.Provider value={{ appConfig: this._appConfig }}>
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <Router basename={routerBasename}>
              <WhiteLabellingContext.Provider value={whiteLabelling}>
                <SnackbarProvider service={UINotificationService}>
                  <DialogProvider service={UIDialogService}>
                    <ModalProvider modal={OHIFModal} service={UIModalService}>
                      <OHIFStandaloneViewer />
                    </ModalProvider>
                  </DialogProvider>
                </SnackbarProvider>
              </WhiteLabellingContext.Provider>
            </Router>
          </I18nextProvider>
        </Provider>
      </AppContext.Provider>
    );
  }

  initUserManager(oidc) {
    if (oidc && !!oidc.length) {
      const firstOpenIdClient = this._appConfig.oidc[0];

      const { protocol, host } = window.location;
      const { routerBasename } = this._appConfig;
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

function _initServices(services) {
  servicesManager.registerServices(services);
}

/**
 * @param
 */
function _initExtensions(extensions, cornerstoneExtensionConfig, appConfig) {
  extensionManager = new ExtensionManager({
    commandsManager,
    servicesManager,
    appConfig,
  });

  const requiredExtensions = [
    GenericViewerCommands,
    [OHIFCornerstoneExtension, cornerstoneExtensionConfig],
    /* WARNING: MUST BE REGISTERED _AFTER_ OHIFCornerstoneExtension */
    MeasurementsPanel,
  ];
  const mergedExtensions = requiredExtensions.concat(extensions);
  extensionManager.registerExtensions(mergedExtensions);
}

function _initHotkeys(hotkeys) {
  const { hotkeyDefinitions = {} } = store.getState().preferences || {};
  let updateStore = false;
  let hotkeysToUse = hotkeyDefinitions;

  if (!Object.keys(hotkeyDefinitions).length) {
    hotkeysToUse = hotkeys;
    updateStore = true;
  }

  if (hotkeysToUse) {
    hotkeysManager.setHotkeys(hotkeysToUse);

    /* Set hotkeys default based on app config. */
    hotkeysManager.setDefaultHotKeys(hotkeys);

    if (updateStore) {
      const { hotkeyDefinitions } = hotkeysManager;
      const windowLevelData = {};
      store.dispatch(
        setUserPreferences({ windowLevelData, hotkeyDefinitions })
      );
    }
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

  /*
   * Make sure base_url and url are not duplicating slashes.
   */
  if (base_url[base_url.length - 1] === '/') {
    base_url = base_url.slice(0, base_url.length - 1);
  }

  return base_url + url;
}

/*
 * Only wrap/use hot if in dev.
 */
const ExportedApp = process.env.NODE_ENV === 'development' ? hot(App) : App;

export default ExportedApp;
export { commandsManager, extensionManager, hotkeysManager, servicesManager };
