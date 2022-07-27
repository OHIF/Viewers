/**
 * Entry point for development and production PWA builds.
 */
import 'regenerator-runtime/runtime';
import App from './App.tsx';
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * EXTENSIONS AND MODES
 * =================
 * pluginImports.js is dynamically generated from extension and mode
 * configuration at build time.
 *
 * pluginImports.js imports all of the modes and extensions and adds them
 * to the window for processing.
 */
import loadDynamicImports from './pluginImports.js';

loadDynamicImports().then(() => {
  /**
   * Combine our appConfiguration with installed extensions and modes.
   * In the future appConfiguration may contain modes added at runtime.
   *  */
  const appProps = {
    config: window ? window.config : {},
    defaultExtensions: window.extensions,
    defaultModes: window.modes,
  };

  /** Create App */
  const app = React.createElement(App, appProps, null);
  /** Render */
  ReactDOM.render(app, document.getElementById('root'));
});
