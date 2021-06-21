// External
import React from 'react';
import PropTypes from 'prop-types';
import i18n from '@ohif/i18n';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import Compose from './routes/Mode/Compose.js';

import {
  DialogProvider,
  Modal,
  ModalProvider,
  SnackbarProvider,
  ThemeWrapper,
  ViewportDialogProvider,
  ViewportGridProvider,
  CineProvider,
  UserAuthenticationProvider,
} from '@ohif/ui';
// Viewer Project
// TODO: Should this influence study list?
import { AppConfigProvider } from '@state';
import createRoutes from './routes';
import appInit from './appInit.js';
import getUserManagerForOpenIdConnectClient from './utils/getUserManagerForOpenIdConnectClient.js';
import Authenticator from './utils/Authenticator.jsx';

// TODO: Temporarily for testing
import '@ohif/mode-longitudinal';

let commandsManager, extensionManager, servicesManager, hotkeysManager;

const initUserManager = (oidc, routerBasename) => {
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

  return getUserManagerForOpenIdConnectClient(openIdConnectConfiguration);
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
  const userManager = initUserManager(oidc, routerBasename);

  // Use config to create routes
  const appRoutes = createRoutes({
    modes,
    dataSources,
    extensionManager,
    servicesManager,
    hotkeysManager,
    routerBasename,
  });
  const {
    UIDialogService,
    UIModalService,
    UINotificationService,
    UIViewportDialogService,
    ViewportGridService,
    CineService,
    UserAuthenticationService,
  } = servicesManager.services;

  const providers = [
    [AppConfigProvider, { value: appConfigState }],
    [I18nextProvider, { i18n }],
    [ThemeWrapper],
    // [UserAuthenticationProvider, { service: UserAuthenticationService}],
    [ViewportGridProvider, {service: ViewportGridService}],
    [ViewportDialogProvider, {service: UIViewportDialogService}],
    [CineProvider, {service: CineService}],
    [SnackbarProvider, {service: UINotificationService}],
    [DialogProvider, {service: UIDialogService}],
    [ModalProvider, {service: UIModalService, modal: Modal}],
  ]
  const CombinedProviders = ({ children }) =>
    Compose({ components: providers, children });

  let routes;

  if (userManager) {
    const getAuthorizationHeader = (user) => {
      return {
        Authorization: `Bearer ${user.access_token}`
      };
    }

    UserAuthenticationService.setServiceImplementation({
      getAuthorizationHeader
    });

    routes = (<Authenticator
                userManager={userManager}
                oidcAuthority={oidc[0].authority}
                routerBasename={routerBasename}
                UserAuthenticationService={UserAuthenticationService}
              >
                {appRoutes}
              </Authenticator>)
  } else {
    routes = appRoutes;
  }

  return (
    <CombinedProviders>
      <BrowserRouter>
        <UserAuthenticationProvider service={UserAuthenticationService}>
          {routes}
        </UserAuthenticationProvider>
      </BrowserRouter>
    </CombinedProviders>
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
