// External
import React from 'react';
import PropTypes from 'prop-types';
import i18n from '@ohif/i18n';
import { I18nextProvider } from 'react-i18next';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { OidcProvider, reducer as oidcReducer } from 'redux-oidc';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import {
  DialogProvider,
  Modal,
  ModalProvider,
  SnackbarProvider,
  ThemeWrapper,
  ViewportDialogProvider,
  ViewportGridProvider,
  HangingProtocolProvider,
} from '@ohif/ui';
// Viewer Project
// TODO: Should this influence study list?
import { AppConfigProvider } from '@state';
import createRoutes from './routes';
import appInit from './appInit.js';
import UserManagerContext from './context/UserManagerContext';
import getUserManagerForOpenIdConnectClient from './utils/getUserManagerForOpenIdConnectClient.js';

// TODO: Temporarily for testing
import '@ohif/mode-longitudinal';
import '@ohif/mode-segmentation';

const store = createStore(oidcReducer);

/**
 * ENV Variable to determine routing behavior
 */
const Router = JSON.parse(process.env.USE_HASH_ROUTER)
  ? HashRouter
  : BrowserRouter;

let commandsManager, extensionManager, servicesManager, hotkeysManager;

const initUserManager = (oidc, routerBasename, store) => {
  if (!oidc || !oidc.length) {
    return;
  }

  const firstOpenIdClient = oidc[0];
  const { protocol, host } = window.location;
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

  return getUserManagerForOpenIdConnectClient(
    store,
    openIdConnectConfiguration
  );
}

function App({ config, defaultExtensions }) {
  const init = appInit(config, defaultExtensions);

  // Set above for named export
  commandsManager = init.commandsManager;
  extensionManager = init.extensionManager;
  servicesManager = init.servicesManager;
  hotkeysManager = init.hotkeysManager;

  // Set appConfig
  const appConfigState = init.appConfig;
  const { routerBasename, modes, dataSources, oidc } = appConfigState;
  const userManager = initUserManager(oidc, routerBasename, store);

  // Use config to create routes
  const appRoutes = createRoutes({
    modes,
    dataSources,
    extensionManager,
    servicesManager,
    hotkeysManager,
  });
  const {
    UIDialogService,
    UIModalService,
    UINotificationService,
    UIViewportDialogService,
    ViewportGridService, // TODO: Should this be a "UI" Service?
    HangingProtocolService,
  } = servicesManager.services;

  if (userManager) {
    return (
      <AppConfigProvider value={appConfigState}>
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <OidcProvider store={store} userManager={userManager}>
              <UserManagerContext.Provider value={userManager}>
                <Router basename={routerBasename}>
                  <ThemeWrapper>
                    <ViewportGridProvider service={ViewportGridService}>
                      <HangingProtocolProvider service={HangingProtocolService}>
                        <ViewportDialogProvider service={UIViewportDialogService}>
                          <SnackbarProvider service={UINotificationService}>
                            <DialogProvider service={UIDialogService}>
                              <ModalProvider modal={Modal} service={UIModalService}>
                                {appRoutes}
                              </ModalProvider>
                            </DialogProvider>
                          </SnackbarProvider>
                        </ViewportDialogProvider>
                      </HangingProtocolProvider>
                    </ViewportGridProvider>
                  </ThemeWrapper>
                </Router>
              </UserManagerContext.Provider>
            </OidcProvider>
          </I18nextProvider>
        </Provider>
      </AppConfigProvider>
    )
  }

  return (
    <AppConfigProvider value={appConfigState}>
      <I18nextProvider i18n={i18n}>
        <Router basename={routerBasename}>
          <ThemeWrapper>
            <ViewportGridProvider service={ViewportGridService}>
              <HangingProtocolProvider service={HangingProtocolService}>
                <ViewportDialogProvider service={UIViewportDialogService}>
                  <SnackbarProvider service={UINotificationService}>
                    <DialogProvider service={UIDialogService}>
                      <ModalProvider modal={Modal} service={UIModalService}>
                        {appRoutes}
                      </ModalProvider>
                    </DialogProvider>
                  </SnackbarProvider>
                </ViewportDialogProvider>
              </HangingProtocolProvider>
            </ViewportGridProvider>
          </ThemeWrapper>
        </Router>
      </I18nextProvider>
    </AppConfigProvider>
  );
}

App.propTypes = {
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
  /* Extensions that are "bundled" or "baked-in" to the application.
   * These would be provided at build time as part of they entry point. */
  defaultExtensions: PropTypes.array,
};

App.defaultProps = {
  config: {
    /**
     * Relative route from domain root that OHIF instance is installed at.
     * For example:
     *
     * Hosted at: https://ohif.org/where-i-host-the/viewer/
     * Value: `/where-i-host-the/viewer/`
     * */
    routerBaseName: '/',
    /**
     *
     */
    showStudyList: true,
    oidc: [],
    extensions: [],
  },
  defaultExtensions: [],
};

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

export default App;

export { commandsManager, extensionManager, servicesManager };
