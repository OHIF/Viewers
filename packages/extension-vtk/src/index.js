import OHIFVTKViewport from './OHIFVTKViewport.js';
import commandsModule from './commandsModule.js';
// This feels weird
import loadLocales from './loadLocales';
import toolbarModule from './toolbarModule.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'vtk',

  getViewportModule() {
    return OHIFVTKViewport;
  },
  getToolbarModule() {
    return toolbarModule;
  },
  getCommandsModule() {
    return commandsModule;
  },
};

loadLocales();
