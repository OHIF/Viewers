// External
import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ThemeWrapper } from '@ohif/ui';
// Viewer Project
// TODO: Should this influence study list?
// import AppContextProvider from './contexts/AppContextProvider.js';
import createRoutes from './routes';
import appInit from './appInit.js';

// Temporarily for testing
import '@ohif/mode-example';

/**
 * ENV Variable to determine routing behavior
 */
const Router = JSON.parse(process.env.USE_HASH_ROUTER)
  ? HashRouter
  : BrowserRouter;

let appConfig, commandsManager, extensionManager, servicesManager;

function App({ config, defaultExtensions }) {
  const init = appInit(config, defaultExtensions);
  const { appRoutes } = init;

  // Set above for named export
  appConfig = init.appConfig;
  commandsManager = init.commandsManager;
  extensionManager = init.extensionManager;
  servicesManager = init.servicesManager;

  // TODO: Expose configuration w/ context?
  // See: `setConfiguration` in master

  return (
    <Router basename={appConfig.routerBasename}>
      <ThemeWrapper>{createRoutes(appRoutes)}</ThemeWrapper>
    </Router>
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
  /* Extensions that are "bundled" or "baked-in" to the application */
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

export { appConfig, commandsManager, extensionManager, servicesManager };
