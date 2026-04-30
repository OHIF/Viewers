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

function setupParentSelectionBridge() {
  // Bridge OHIF selection state to embedding parent app (iframe host).
  if (!window.parent || window.parent === window) {
    return;
  }

  let lastPayload = '';

  const emitSelection = () => {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const studyInstanceUIDs = params.get('StudyInstanceUIDs') || '';
      const payload = JSON.stringify({
        type: 'OHIF_SELECTION',
        studyInstanceUIDs,
        href: window.location.href,
      });

      if (payload === lastPayload) {
        return;
      }

      lastPayload = payload;
      window.parent.postMessage(JSON.parse(payload), '*');
    } catch (error) {
      // Ignore bridge errors to avoid impacting viewer rendering.
    }
  };

  const wrapHistoryMethod = methodName => {
    const original = window.history[methodName];
    window.history[methodName] = function (...args) {
      const result = original.apply(this, args);
      setTimeout(emitSelection, 0);
      return result;
    };
  };

  wrapHistoryMethod('pushState');
  wrapHistoryMethod('replaceState');

  window.addEventListener('popstate', emitSelection);
  window.addEventListener('hashchange', emitSelection);

  emitSelection();
  // Poll as fallback for navigation paths that do not trigger history events.
  setInterval(emitSelection, 1200);
}

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

  setupParentSelectionBridge();

  const root = createRoot(container);
  root.render(React.createElement(App, appProps));
});
