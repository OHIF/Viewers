import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ThemeWrapper } from '@ohif/ui';
import {
  CommandsManager,
  ExtensionManager,
  ServicesManager,
  HotkeysManager,
  UINotificationService,
  UIModalService,
  UIDialogService,
  MeasurementService,
  utils,
  redux as reduxOHIF,
} from '@ohif/core';
import routes from './routes';

/**
 * ENV Variable to determine routing behavior
 */
const Router = JSON.parse(process.env.USE_HASH_ROUTER)
  ? HashRouter
  : BrowserRouter;

const commandsManagerConfig = {
  /** Used by commands to inject `viewports` from "redux" */
  getAppState: () => store.getState(),
  /** Used by commands to determine active context */
  getActiveContexts: () => getActiveContexts(store.getState()),
};
const commandsManager = new CommandsManager(commandsManagerConfig);
const servicesManager = new ServicesManager();
// const hotkeysManager = new HotkeysManager(commandsManager, servicesManager);
const extensionManager = new ExtensionManager({
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

extensionManager.registerExtensions(/* Array of Extensions */);

function App({ config, defaultExtensions }) {
  const appConfig = {
    ...(typeof config === 'function' ? config({ servicesManager }) : config),
  };

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
