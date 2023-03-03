import { id } from './id';
import React from 'react';

import getSopClassHandlerModule from './getSopClassHandlerModule';
import PanelSegmentation from './panels/PanelSegmentation';

const Component = React.lazy(() => {
  return import(
    /* webpackPrefetch: true */ './viewports/OHIFCornerstoneSEGViewport'
  );
});

const OHIFCornerstoneSEGViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

/**
 * You can remove any of the following modules if you don't need them.
 */
const extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   * You ID can be anything you want, but it should be unique.
   */
  id,

  /**
   * Perform any pre-registration tasks here. This is called before the extension
   * is registered. Usually we run tasks such as: configuring the libraries
   * (e.g. cornerstone, cornerstoneTools, ...) or registering any services that
   * this extension is providing.
   */
  preRegistration: ({
    servicesManager,
    commandsManager,
    configuration = {},
  }) => {},
  /**
   * PanelModule should provide a list of panels that will be available in OHIF
   * for Modes to consume and render. Each panel is defined by a {name,
   * iconName, iconLabel, label, component} object. Example of a panel module
   * is the StudyBrowserPanel that is provided by the default extension in OHIF.
   */
  getPanelModule: ({ servicesManager, commandsManager, extensionManager }) => {
    const wrappedPanelSegmentation = () => {
      return (
        <PanelSegmentation
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
        />
      );
    };

    return [
      {
        name: 'panelSegmentation',
        iconName: 'tab-segmentation',
        iconLabel: 'Segmentation',
        label: 'Segmentation',
        component: wrappedPanelSegmentation,
      },
    ];
  },
  getViewportModule({ servicesManager, extensionManager }) {
    const ExtendedOHIFCornerstoneSEGViewport = props => {
      return (
        <OHIFCornerstoneSEGViewport
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          {...props}
        />
      );
    };

    return [
      { name: 'dicom-seg', component: ExtendedOHIFCornerstoneSEGViewport },
    ];
  },
  /**
   * SopClassHandlerModule should provide a list of sop class handlers that will be
   * available in OHIF for Modes to consume and use to create displaySets from Series.
   * Each sop class handler is defined by a { name, sopClassUids, getDisplaySetsFromSeries}.
   * Examples include the default sop class handler provided by the default extension
   */
  getSopClassHandlerModule,
};

export default extension;
