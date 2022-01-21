import getContextModule from './getContextModule.js';
import getPanelModule from './getPanelModule.js';
import getViewportModule from './getViewportModule.js';

// TODO -> Inject these using webpack from package.json
const id = '@ohif/extension-measurement-tracking';
const version = '0.0.1';

export default {
  /**
   * Only two required properties. Should be a unique value across all extensions.
   */
  id,
  version,

  getContextModule,
  getPanelModule,
  getViewportModule,
  getCommandsModule({ servicesManager }) {
    return {
      definitions: {
        setToolActive: {
          commandFn: ({ toolName, element }) => {
            if (!toolName) {
              console.warn('No toolname provided to setToolActive command');
            }

            // Set same tool or alt tool
            cornerstoneTools.setToolActiveForElement(element, toolName, {
              mouseButtonMask: 1,
            });
          },
          storeContexts: [],
          options: {},
        },
      },
      defaultContext: 'ACTIVE_VIEWPORT::TRACKED',
    };
  },
};
