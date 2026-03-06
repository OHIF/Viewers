/**
 * Entry point for development and production PWA builds.
 */
import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';

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

function loadLocalOverride() {
  const base = typeof window !== 'undefined' && (window.PUBLIC_URL || '/');
  const url = base.replace(/\/?$/, '/') + 'config/local.override.json';
  return fetch(url)
    .then(res => (res.ok ? res.json() : null))
    .catch(() => null);
}

function mergeConfig(base, override) {
  if (!override || typeof override !== 'object') return base;
  return { ...base, ...override };
}

loadDynamicConfig(window.config).then(async config_json => {
  // Reset Dynamic config if defined
  if (config_json !== null) {
    window.config = config_json;
  }

  const localOverride = await loadLocalOverride();
  if (localOverride) {
    window.config = mergeConfig(window.config || {}, localOverride);
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
  root.render(React.createElement(App, appProps));
});
