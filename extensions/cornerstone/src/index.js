import asyncComponent from './asyncComponent.js';
import commandsModule from './commandsModule.js';
import toolbarModule from './toolbarModule.js';

const OHIFCornerstoneViewport = asyncComponent(() => import( /* webpackChunkName: "OHIFCornerstoneViewport" */ './OHIFCornerstoneViewport.js'));

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
    return toolbarModule;
  },
  getCommandsModule() {
    return commandsModule;
  },
};
