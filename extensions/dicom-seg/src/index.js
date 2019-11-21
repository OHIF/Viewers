import init from './init.js';
import commandsModule from './commandsModule.js';
import toolbarModule from './toolbarModule.js';
import panelModule from './panelModule.js';
import sopClassHandlerModule from './OHIFDicomSegSopClassHandler.js';

// TODO: If a vtkjs viewport or cornerstone viewport is open,
// Add a drop down to select which segmentation to display. Fetch and cache if
// its not available yet.

// TODO: Should all tools for cornerstone/vtkjs live inside this extension?
// TODO: Should all segmentation UI live in this extension?
// TODO: This extension should work if either cornerstone or

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'seg',

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  preRegistration({ servicesManager, configuration = {} }) {
    init({ servicesManager, configuration });
  },
  getToolbarModule({ servicesManager }) {
    return toolbarModule;
  },
  getCommandsModule({ servicesManager }) {
    return commandsModule;
  },
  getPanelModule({ servicesManager }) {
    return panelModule;
  },
  getSopClassHandlerModule({ servicesManager }) {
    return sopClassHandlerModule;
  },
};
