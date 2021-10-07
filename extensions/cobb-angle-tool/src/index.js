import init from './init.js';
import toolbarModule from './toolbarModule.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'com.ohif.cobb-angle-tool',

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  preRegistration({ servicesManager, configuration = {} }) {
    init({ servicesManager, configuration });
  },
  getToolbarModule() {
    return toolbarModule;
  },
};
