import init from './init.js';
import sopClassHandlerModule from './OHIFDicomRTStructSopClassHandler';
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
  getSopClassHandlerModule({ servicesManager }) {
    return sopClassHandlerModule;
  },
};
