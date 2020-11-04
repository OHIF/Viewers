import { getDicomWebClientFromConfig } from './utils';
import { getCommands } from './commandsModule';
import { version } from '../package.json';
import toolbarModule from './toolbarModule';
import state from './state';

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

  preRegistration({ appConfig, configuration }) {
    const dicomWebClient = getDicomWebClientFromConfig(appConfig);
    if (dicomWebClient) {
      sharedContext.dicomWebClient = dicomWebClient;
    }

    if (configuration) {
      if (configuration.mailTo) {
        state.mailTo = configuration.mailTo;
      }

      if (configuration.debugModalMessage) {
        state.debugModalMessage = configuration.debugModalMessage;
      }
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
