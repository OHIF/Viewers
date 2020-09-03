import { getDicomWebClientFromConfig } from './utils';
import { getCommands } from './commandsModule';
import { version } from '../package.json';
import toolbarModule from './toolbarModule';

/**
 * Constants
 */

/**
 * Globals
 */

const sharedContext = {
  dicomWebClient: null,
};

/**
 * Extension
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'dicom-p10-downloader',
  version,

  /**
   * LIFECYCLE HOOKS
   */

  preRegistration({ appConfig }) {
    const dicomWebClient = getDicomWebClientFromConfig(appConfig);
    if (dicomWebClient) {
      sharedContext.dicomWebClient = dicomWebClient;
    }
  },

  /**
   * MODULE GETTERS
   */

  getCommandsModule({ servicesManager, extensionManager }) {
    return getCommands(sharedContext, servicesManager, extensionManager);
  },

  getToolbarModule() {
    return toolbarModule;
  },
};
