/**
 * Entry point for development and production PWA builds.
 */
import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';
import AuthGate from '../auth/AuthGate';
import LoginPage from '../loginPage';

/**
 * EXTENSIONS AND MODES
 * =================
 * pluginImports.js is dynamically generated from extension and mode
 * configuration at build time.
 *
 * pluginImports.js imports all of the modes and extensions and adds them
 * to the window for processing.
 */
import { modes as defaultModes, extensions as defaultExtensions } from './pluginImports';
import loadDynamicConfig from './loadDynamicConfig';
export { history } from './utils/history';
export { preserveQueryParameters, preserveQueryStrings } from './utils/preserveQueryParameters';

loadDynamicConfig(window.config).then(config_json => {
  // Reset Dynamic config if defined
  if (config_json !== null) {
    window.config = config_json;
  }

  /**
   * Combine our appConfiguration with installed extensions and modes.
   * In the future appConfiguration may contain modes added at runtime.
   *  */
  const appProps = {
    config: window ? window.config : {},
    defaultExtensions,
    defaultModes,
  };

  const container = document.getElementById('root');
  const root = createRoot(container);

  if (window.location.pathname === '/login') {
    root.render(React.createElement(LoginPage));
  } else if (process.env.AUTH_GATE_ENABLED === 'true') {
    root.render(React.createElement(AuthGate, null, React.createElement(App, appProps)));
  } else {
    root.render(React.createElement(App, appProps));
  }
});
