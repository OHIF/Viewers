// External
import React from 'react';
import PropTypes from 'prop-types';
import i18n from '@ohif/i18n';
import { I18nextProvider } from 'react-i18next';
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
  CineProvider,
} from '@ohif/ui';
// Viewer Project
// TODO: Should this influence study list?
import { AppConfigProvider } from '@state';
import createRoutes from './routes';
import appInit from './appInit.js';

// TODO: Temporarily for testing
import '@ohif/mode-longitudinal';

/**
 * ENV Variable to determine routing behavior
 */
const Router = JSON.parse(process.env.USE_HASH_ROUTER)
  ? HashRouter
  : BrowserRouter;

let commandsManager, extensionManager, servicesManager, hotkeysManager;

function App({ config, defaultExtensions }) {
  const init = appInit(config, defaultExtensions);

  // Set above for named export
  commandsManager = init.commandsManager;
  extensionManager = init.extensionManager;
  servicesManager = init.servicesManager;
  hotkeysManager = init.hotkeysManager;

  // Set appConfig
  const appConfigState = init.appConfig;
  const { routerBasename, modes, dataSources } = appConfigState;
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
    CineService
  } = servicesManager.services;

  return (
    <AppConfigProvider value={appConfigState}>
      <I18nextProvider i18n={i18n}>
        <Router basename={routerBasename}>
          <ThemeWrapper>
            <ViewportGridProvider service={ViewportGridService}>
              <HangingProtocolProvider service={HangingProtocolService}>
                <ViewportDialogProvider service={UIViewportDialogService}>
                  <CineProvider service={CineService}>
                    <SnackbarProvider service={UINotificationService}>
                      <DialogProvider service={UIDialogService}>
                        <ModalProvider modal={Modal} service={UIModalService}>
                          {appRoutes}
                        </ModalProvider>
                      </DialogProvider>
                    </SnackbarProvider>
                  </CineProvider>
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

export default App;

export { commandsManager, extensionManager, servicesManager };
