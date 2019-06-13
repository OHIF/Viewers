import OHIFCornerstoneViewport from './OHIFCornerstoneViewport.js';
import ToolbarModule from './ToolbarModule.js';
import commandsModule from './commandsModule.js';

/**
 *
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'cornerstone',

  getViewportModule() {
    return OHIFCornerstoneViewport;
  },
  getToolbarModule() {
    return ToolbarModule;
  },
  getCommandsModule() {
    return commandsModule;
  }
};
