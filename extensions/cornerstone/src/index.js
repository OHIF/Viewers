import ConnectedCornerstoneViewport from './ConnectedCornerstoneViewport.js';
import init from './init.js';
import commandsModule from './commandsModule.js';
import toolbarModule from './toolbarModule.js';

/**
 *
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'cornerstone',

  preRegistration(configuration = {}) {
    init(configuration);
  },
  getViewportModule() {
    return ConnectedCornerstoneViewport;
  },
  getToolbarModule() {
    return toolbarModule;
  },
  getCommandsModule() {
    return commandsModule;
  },
};
