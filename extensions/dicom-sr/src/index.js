import React from 'react';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import onModeEnter from './onModeEnter';
import id from './id.js';
import init from './init';

const Component = React.lazy(() => {
  return import('./viewports/OHIFCornerstoneSRViewport');
});

const OHIFCornerstoneSRViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

/**
 *
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  dependencies: [
    // TODO -> This isn't used anywhere yet, but we do have a hard dependency, and need to check for these in the future.
    // OHIF-229
    {
      id: 'org.ohif.cornerstone',
      version: '3.0.0',
    },
    {
      id: 'org.ohif.measurement-tracking',
      version: '^0.0.1',
    },
  ],

  preRegistration({ servicesManager, configuration = {} }) {
    init({ servicesManager, configuration });
  },

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  getViewportModule({ servicesManager, extensionManager }) {
    const ExtendedOHIFCornerstoneSRViewport = props => {
      return (
        <OHIFCornerstoneSRViewport
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          {...props}
        />
      );
    };

    return [{ name: 'dicom-sr', component: ExtendedOHIFCornerstoneSRViewport }];
  },
  getCommandsModule({ servicesManager }) {
    return {
      definitions: {
        setToolActive: {
          commandFn: ({ toolName, element }) => {
            if (!toolName) {
              console.warn('No toolname provided to setToolActive command');
            }

            // Set same tool or alt tool
            const toolAlias = _getToolAlias(toolName);

            cornerstoneTools.setToolActiveForElement(element, toolAlias, {
              mouseButtonMask: 1,
            });
          },
          storeContexts: [],
          options: {},
        },
      },
      defaultContext: 'ACTIVE_VIEWPORT::STRUCTURED_REPORT',
    };
  },
  getSopClassHandlerModule,
  onModeEnter,
};

function _getToolAlias(toolName) {
  let toolAlias = toolName;

  switch (toolName) {
    case 'Length':
      toolAlias = 'SRLength';
      break;
    case 'Bidirectional':
      toolAlias = 'SRBidirectional';
      break;
    case 'ArrowAnnotate':
      toolAlias = 'SRArrowAnnotate';
      break;
    case 'EllipticalRoi':
      toolAlias = 'SREllipticalRoi';
      break;
  }

  return toolAlias;
}
