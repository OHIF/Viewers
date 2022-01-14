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
import OpenIdConnectRoutes from './utils/OpenIdConnectRoutes.jsx';

let commandsManager, extensionManager, servicesManager, hotkeysManager;

function App({ config, defaultExtensions, defaultModes }) {
  const init = appInit(config, defaultExtensions, defaultModes);

  // Set above for named export
  commandsManager = init.commandsManager;
  extensionManager = init.extensionManager;
  servicesManager = init.servicesManager;
  hotkeysManager = init.hotkeysManager;

  // Set appConfig
  const appConfigState = init.appConfig;
  const { routerBasename, modes, dataSources, oidc } = appConfigState;

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
    [UserAuthenticationProvider, { service: UserAuthenticationService }],
    [I18nextProvider, { i18n }],
    [ThemeWrapper],
    [ViewportGridProvider, { service: ViewportGridService }],
    [ViewportDialogProvider, { service: UIViewportDialogService }],
    [CineProvider, { service: CineService }],
    [SnackbarProvider, { service: UINotificationService }],
    [DialogProvider, { service: UIDialogService }],
    [ModalProvider, { service: UIModalService, modal: Modal }],
  ];
  const CombinedProviders = ({ children }) =>
    Compose({ components: providers, children });

  let authRoutes = null;

  if (oidc) {
    authRoutes = (
      <OpenIdConnectRoutes
        oidc={oidc}
        routerBasename={routerBasename}
        UserAuthenticationService={UserAuthenticationService}
      />
    );
  }

  return (
    <CombinedProviders>
      <BrowserRouter>
        {authRoutes}
        {appRoutes}
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

export default App;

export { commandsManager, extensionManager, servicesManager };
