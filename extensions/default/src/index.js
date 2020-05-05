import webApi from './modules/webApi';

/**
 * Array that contains the default modules.
 */
const defaultModules = [webApi];

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'default',

  getDataSourcesModule() {
    return defaultModules;
  },
};
