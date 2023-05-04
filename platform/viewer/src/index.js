/**
 * Entry point for development and production PWA builds.
 */
import 'regenerator-runtime/runtime';
import App from './App';
import React from 'react';
import ReactDOM from 'react-dom';
import { history } from './utils/history';

/**
 * EXTENSIONS AND MODES
 * =================
 * pluginImports.js is dynamically generated from extension and mode
 * configuration at build time.
 *
 * pluginImports.js imports all of the modes and extensions and adds them
 * to the window for processing.
 */
import {
  modes as defaultModes,
  extensions as defaultExtensions,
} from './pluginImports';

/**
 * Combine our appConfiguration with installed extensions and modes.
 * In the future appConfiguration may contain modes added at runtime.
 *  */
const appProps = {
  config: window ? window.config : {},
  defaultExtensions,
  defaultModes,
};

/** Create App */
const app = React.createElement(App, appProps, null);
/** Render */
ReactDOM.render(app, document.getElementById('root'));

export { history };
