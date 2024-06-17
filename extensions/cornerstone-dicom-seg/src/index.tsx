import { id } from './id';
import React from 'react';

import getSopClassHandlerModule from './getSopClassHandlerModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import getPanelModule from './getPanelModule';
import getCommandsModule from './commandsModule';
import { getToolbarModule } from './getToolbarModule';

const Component = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './viewports/OHIFCornerstoneSEGViewport');
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
   * PanelModule should provide a list of panels that will be available in OHIF
   * for Modes to consume and render. Each panel is defined by a {name,
   * iconName, iconLabel, label, component} object. Example of a panel module
   * is the StudyBrowserPanel that is provided by the default extension in OHIF.
   */
  getPanelModule,
  getCommandsModule,
  getToolbarModule,
  getViewportModule({ servicesManager, extensionManager, commandsManager }) {
    const ExtendedOHIFCornerstoneSEGViewport = props => {
      return (
        <OHIFCornerstoneSEGViewport
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          commandsManager={commandsManager}
          {...props}
        />
      );
    };

    return [{ name: 'dicom-seg', component: ExtendedOHIFCornerstoneSEGViewport }];
  },
  /**
   * SopClassHandlerModule should provide a list of sop class handlers that will be
   * available in OHIF for Modes to consume and use to create displaySets from Series.
   * Each sop class handler is defined by a { name, sopClassUids, getDisplaySetsFromSeries}.
   * Examples include the default sop class handler provided by the default extension
   */
  getSopClassHandlerModule,
  getHangingProtocolModule,
};

export default extension;
