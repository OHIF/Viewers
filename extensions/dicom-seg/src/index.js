import init from './init.js';
import toolbarModule from './toolbarModule.js';
import panelModule from './panelModule.js';
import sopClassHandlerModule from './OHIFDicomSegSopClassHandler.js';
import id from './id.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  preRegistration({ servicesManager, configuration = {} }) {
    init({ servicesManager, configuration });
  },
  getToolbarModule({ servicesManager }) {
    return toolbarModule;
  },
  getPanelModule({ servicesManager }) {
    return panelModule;
  },
  getSopClassHandlerModule({ servicesManager }) {
    return sopClassHandlerModule;
  },
};
