// External
import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import {
  DialogProvider,
  Modal,
  ModalProvider,
  Notification,
  SnackbarProvider,
  ThemeWrapper,
  ViewportDialogProvider,
  ViewportGridProvider,
} from '@ohif/ui';
// Viewer Project
// TODO: Should this influence study list?
import { appConfigContext } from '@state/appConfig.context';
import { useAppConfig } from '@hooks/useAppConfig';
import createRoutes from './routes';
import appInit from './appInit.js';

// TODO: Temporarily for testing
import '@ohif/mode-example';
import '@ohif/mode-longitudinal';

/**
 * ENV Variable to determine routing behavior
 */
const Router = JSON.parse(process.env.USE_HASH_ROUTER)
  ? HashRouter
  : BrowserRouter;

let commandsManager, extensionManager, servicesManager;

function App({ config, defaultExtensions }) {
  const init = appInit(config, defaultExtensions);

  // Set above for named export
  commandsManager = init.commandsManager;
  extensionManager = init.extensionManager;
  servicesManager = init.servicesManager;

  // Set appConfig
  const appConfigContextApi = useAppConfig(init.appConfig);
  const { routerBasename, modes, dataSources } = appConfigContextApi.appConfig;
  // Use config to create routes
  const appRoutes = createRoutes(
    modes,
    dataSources,
    extensionManager,
    servicesManager
  );
  const {
    UIDialogService,
    UIModalService,
    UINotificationService,
    UIViewportDialogService,
  } = servicesManager.services;

  // A UI Service may need to use the ViewportGrid context
  const viewportGridReducer = (state, action) => {
    console.log(state, action);

    switch (action.type) {
      case 'SET_ACTIVE_VIEWPORT_INDEX':
        return { ...state, ...{ activeViewportIndex: action.payload } };
      case 'SET_DISPLAYSET_FOR_VIEWPORT':
        const { viewportIndex, displaySetInstanceUID } = action.payload;
        const viewports = state.viewports.slice();

        viewports[viewportIndex] = { displaySetInstanceUID };

        return { ...state, ...{ viewports } };
      default:
        return action.payload;
    }
  };

  return (
    <appConfigContext.Provider value={appConfigContextApi}>
      <Router basename={routerBasename}>
        <ThemeWrapper>
          <ViewportGridProvider
            initialState={{
              numRows: 1,
              numCols: 1,
              viewports: [],
              activeViewportIndex: 0,
            }}
            reducer={viewportGridReducer}
          >
            <ViewportDialogProvider service={UIViewportDialogService}>
              <SnackbarProvider service={UINotificationService}>
                <DialogProvider service={UIDialogService}>
                  <ModalProvider modal={Modal} service={UIModalService}>
                    {appRoutes}
                  </ModalProvider>
                </DialogProvider>
              </SnackbarProvider>
            </ViewportDialogProvider>
          </ViewportGridProvider>
        </ThemeWrapper>
      </Router>
    </appConfigContext.Provider>
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
