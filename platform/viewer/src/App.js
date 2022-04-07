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
  LoggerProvider,
  ErrorBoundary,
} from '@ohif/ui';

import {
  CommandsManager,
  ExtensionManager,
  ServicesManager,
  HotkeysManager,
  UINotificationService,
  UIModalService,
  UIDialogService,
  LoggerService,
  MeasurementService,
  utils,
  redux as reduxOHIF,
} from '@ohif/core';

import i18n from '@ohif/i18n';

// TODO: This should not be here
//import './config';
import { setConfiguration } from './config';

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
import WhiteLabelingContext from './context/WhiteLabelingContext';
import UserManagerContext from './context/UserManagerContext';
import { AppProvider, useAppContext, CONTEXTS } from './context/AppContext';

/** ~~~~~~~~~~~~~ Application Setup */
const commandsManagerConfig = {
  getAppState: () => store.getState(),
  getActiveContexts: () => getActiveContexts(store.getState()),
};

/** Managers */
const commandsManager = new CommandsManager(commandsManagerConfig);
const servicesManager = new ServicesManager();
const hotkeysManager = new HotkeysManager(commandsManager, servicesManager);
let extensionManager;
/** ~~~~~~~~~~~~~ End Application Setup */

// TODO[react] Use a provider when the whole tree is React
window.store = store;

window.ohif = window.ohif || {};
window.ohif.app = {
  commandsManager,
  hotkeysManager,
  servicesManager,
  extensionManager,
};

class App extends Component {
  static propTypes = {
    config: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({
        routerBasename: PropTypes.string.isRequired,
        oidc: PropTypes.array,
        whiteLabeling: PropTypes.shape({
          createLogoComponentFn: PropTypes.func,
        }),
        extensions: PropTypes.array,
      }),
    ]).isRequired,
    defaultExtensions: PropTypes.array,
  };

  static defaultProps = {
    config: {
      showStudyList: true,
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
      showStudyList: true,
      cornerstoneExtensionConfig: {},
      extensions: [],
      routerBasename: '/',
    };

    this._appConfig = {
      ...appDefaultConfig,
      ...(typeof config === 'function' ? config({ servicesManager }) : config),
    };

    const {
      servers,
      hotkeys: appConfigHotkeys,
      cornerstoneExtensionConfig,
      extensions,
      oidc,
    } = this._appConfig;

    setConfiguration(this._appConfig);

    this.initUserManager(oidc);
    _initServices([
      UINotificationService,
      UIModalService,
      UIDialogService,
      MeasurementService,
      LoggerService,
    ]);
    _initExtensions(
      [...defaultExtensions, ...extensions],
      cornerstoneExtensionConfig,
      this._appConfig
    );

    /*
     * Must run after extension commands are registered
     * if there is no hotkeys from localStorage set up from config.
     */
    _initHotkeys(appConfigHotkeys);
    _initServers(servers);
    initWebWorkers();
  }

  render() {
    const { whiteLabeling, routerBasename } = this._appConfig;
    const {
      UINotificationService,
      UIDialogService,
      UIModalService,
      MeasurementService,
      LoggerService,
    } = servicesManager.services;

    if (this._userManager) {
      return (
        <ErrorBoundary context="App">
          <Provider store={store}>
            <AppProvider config={this._appConfig}>
              <I18nextProvider i18n={i18n}>
                <OidcProvider store={store} userManager={this._userManager}>
                  <UserManagerContext.Provider value={this._userManager}>
                    <Router basename={routerBasename}>
                      <WhiteLabelingContext.Provider value={whiteLabeling}>
                        <LoggerProvider service={LoggerService}>
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
                        </LoggerProvider>
                      </WhiteLabelingContext.Provider>
                    </Router>
                  </UserManagerContext.Provider>
                </OidcProvider>
              </I18nextProvider>
            </AppProvider>
          </Provider>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary context="App">
        <Provider store={store}>
          <AppProvider config={this._appConfig}>
            <I18nextProvider i18n={i18n}>
              <Router basename={routerBasename}>
                <WhiteLabelingContext.Provider value={whiteLabeling}>
                  <LoggerProvider service={LoggerService}>
                    <SnackbarProvider service={UINotificationService}>
                      <DialogProvider service={UIDialogService}>
                        <ModalProvider
                          modal={OHIFModal}
                          service={UIModalService}
                        >
                          <OHIFStandaloneViewer />
                        </ModalProvider>
                      </DialogProvider>
                    </SnackbarProvider>
                  </LoggerProvider>
                </WhiteLabelingContext.Provider>
              </Router>
            </I18nextProvider>
          </AppProvider>
        </Provider>
      </ErrorBoundary>
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
    api: {
      contexts: CONTEXTS,
      hooks: {
        useAppContext,
      },
    },
  });

  const requiredExtensions = [
    GenericViewerCommands,
    [OHIFCornerstoneExtension, cornerstoneExtensionConfig],
  ];

  if (appConfig.disableMeasurementPanel !== true) {
    /* WARNING: MUST BE REGISTERED _AFTER_ OHIFCornerstoneExtension */
    requiredExtensions.push(MeasurementsPanel);
  }

  const mergedExtensions = requiredExtensions.concat(extensions);
  extensionManager.registerExtensions(mergedExtensions);
}

/**
 *
 * @param {Object} appConfigHotkeys - Default hotkeys, as defined by app config
 */
function _initHotkeys(appConfigHotkeys) {
  // TODO: Use something more resilient
  // TODO: Mozilla has a special library for this
  const userPreferredHotkeys = JSON.parse(
    localStorage.getItem('hotkey-definitions') || '{}'
  );

  // TODO: hotkeysManager.isValidDefinitionObject(/* */)
  const hasUserPreferences =
    userPreferredHotkeys && Object.keys(userPreferredHotkeys).length > 0;
  if (hasUserPreferences) {
    hotkeysManager.setHotkeys(userPreferredHotkeys);
  } else {
    hotkeysManager.setHotkeys(appConfigHotkeys);
  }

  hotkeysManager.setDefaultHotKeys(appConfigHotkeys);
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
