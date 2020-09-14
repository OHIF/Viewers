import getCommandsModule from './getCommandsModule';
import toolbarModule from './toolbarModule';

/**
 * Constants
 */

/**
 * Extension
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'dicom-tag-browser',

  /**
   * MODULE GETTERS
   */
  getCommandsModule({ servicesManager }) {
    return getCommandsModule(servicesManager);
  },
  getToolbarModule() {
    return toolbarModule;
  },
};
