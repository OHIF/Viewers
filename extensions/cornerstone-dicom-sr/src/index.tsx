import React from 'react';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import { srProtocol } from './getHangingProtocolModule';
import getCommandsModule from './commandsModule';
import preRegistration from './init';
import { id } from './id.js';
import toolNames from './tools/toolNames';
import hydrateStructuredReport from './utils/hydrateStructuredReport';
import createReferencedImageDisplaySet from './utils/createReferencedImageDisplaySet';
import Enums from './enums';
import { ViewportActionButton } from '@ohif/ui';
import i18n from '@ohif/i18n';

const Component = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './components/OHIFCornerstoneSRViewport');
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

  onModeEnter({ servicesManager }) {
    const { toolbarService } = servicesManager.services;

    toolbarService.addButtons([
      {
        // A default button for loading measurements added to the toolbar below.
        // Customizations to this button can be made in the mode using this extension.
        // For example, the button label can be changed and/or command props to
        // not clear the measurements can be passed to the command.
        id: 'loadSRMeasurements',
        component: props => (
          <ViewportActionButton {...props}>{i18n.t('Common:LOAD')}</ViewportActionButton>
        ),
        props: {
          commands: [
            {
              commandName: 'loadSRMeasurements',
            },
          ],
        },
      },
    ]);

    // The toolbar used in the viewport's status bar. The mode can further customize
    // it to optionally add other buttons.
    toolbarService.createButtonSection('loadSRMeasurements', ['loadSRMeasurements']);
  },

  preRegistration,

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
  getCommandsModule,
  getSopClassHandlerModule,
  // Include dynamically computed values such as toolNames not known till instantiation
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
export { hydrateStructuredReport, createReferencedImageDisplaySet, srProtocol, Enums, toolNames };
