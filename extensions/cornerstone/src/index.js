import init from './init.js';
import asyncComponent from './asyncComponent.js';
import commandsModule from './commandsModule.js';
import toolbarModule from './toolbarModule.js';
import CornerstoneViewportDownloadForm from './CornerstoneViewportDownloadForm';

const OHIFCornerstoneViewport = asyncComponent(() =>
  import(
    /* webpackChunkName: "OHIFCornerstoneViewport" */ './OHIFCornerstoneViewport.js'
  )
);

/**
 *
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'cornerstone',

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  preRegistration({ servicesManager, configuration = {} }) {
    init({ servicesManager, configuration });
  },
  getViewportModule() {
    return OHIFCornerstoneViewport;
  },
  getToolbarModule() {
    return toolbarModule;
  },
  getCommandsModule({ servicesManager }) {
    return commandsModule({ servicesManager });
  },
};

export { CornerstoneViewportDownloadForm };
