import React from 'react';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import id from './id.js';

const Component = React.lazy(() => {
  return import(
    /* webpackPrefetch: true */ './viewports/OHIFCornerstoneEcgViewport'
  );
});

const OHIFCornerstoneEcgViewport = props => {
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
    // No-op for now
  },

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  getViewportModule({ servicesManager, extensionManager }) {
    const ExtendedOHIFCornerstoneEcgViewport = props => {
      return (
        <OHIFCornerstoneEcgViewport
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          {...props}
        />
      );
    };

    return [{ name: 'dicom-ecg', component: ExtendedOHIFCornerstoneEcgViewport }];
  },
  getCommandsModule({ servicesManager }) {
    return {
      definitions: {
        setToolActive: {
          commandFn: ({ toolName, element }) => {
            if (!toolName) {
              console.warn('No toolname provided to setToolActive command');
            }

            cornerstoneTools.setToolActiveForElement(element, toolName, {
              mouseButtonMask: 1,
            });
          },
          storeContexts: [],
          options: {},
        },
      },
      defaultContext: 'ACTIVE_VIEWPORT::ECG',
    };
  },
  getSopClassHandlerModule,
};
