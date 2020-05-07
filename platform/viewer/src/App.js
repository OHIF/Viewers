// External
import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ThemeWrapper } from '@ohif/ui';
// Viewer Project
import routes from './routes';
import appInit from './appInit.js';

/**
 * ENV Variable to determine routing behavior
 */
const Router = JSON.parse(process.env.USE_HASH_ROUTER)
  ? HashRouter
  : BrowserRouter;

function App({ config, defaultExtensions }) {
  const {
    appConfig,
    commandsManager,
    extensionManager,
    servicesManager,
  } = appInit(config, defaultExtensions);

  // TODO: Expose configuration w/ context?
  // See: `setConfiguration` in master

  return (
    <Router basename={appConfig.routerBasename}>
      <ThemeWrapper>{routes()}</ThemeWrapper>
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
