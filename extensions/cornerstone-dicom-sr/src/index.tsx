import React from 'react';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import onModeEnter from './onModeEnter';
import commandsModule from './commandsModule';
import init from './init';
import { id } from './id.js';
import toolNames from './tools/toolNames';
import hydrateStructuredReport from './utils/hydrateStructuredReport';
import convertCode from './utils/convertCode';

const Component = React.lazy(() => {
  return import(
    /* webpackPrefetch: true */ './viewports/OHIFCornerstoneSRViewport'
  );
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
const dicomSRExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  onModeEnter,

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
  getCommandsModule({ servicesManager, commandsManager, extensionManager }) {
    return commandsModule({
      servicesManager,
      commandsManager,
      extensionManager,
    });
  },
  getSopClassHandlerModule,

  // Include dynmically computed values such as toolNames not known till instantiation
  getUtilityModule({ servicesManager }) {
    return [
      {
        name: 'tools',
        exports: {
          toolNames,
        },
      },
    ];
  },
};

export default dicomSRExtension;

// Put static exports here so they can be type checked
export { hydrateStructuredReport, convertCode };
