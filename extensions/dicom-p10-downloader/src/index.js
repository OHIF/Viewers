import { getDicomWebClientFromConfig } from './utils';
import { getCommands } from './commandsModule';

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

  getCommandsModule() {
    return getCommands(sharedContext);
  },
};
