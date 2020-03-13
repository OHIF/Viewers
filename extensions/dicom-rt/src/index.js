import init from './init.js';
import sopClassHandlerModule from './OHIFDicomRTStructSopClassHandler';
import id from './id.js';
import panelModule from './panelModule';

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
  getPanelModule({ servicesManager }) {
    return panelModule;
  },
  getSopClassHandlerModule({ servicesManager }) {
    return sopClassHandlerModule;
  },
};
