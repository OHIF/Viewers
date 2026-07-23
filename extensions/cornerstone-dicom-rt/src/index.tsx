import { id } from './id';
import React from 'react';
import { Types } from '@ohif/core';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import getCommandsModule from './getCommandsModule';

const Component = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './viewports/OHIFCornerstoneRTViewport');
});

const OHIFCornerstoneRTViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

/**
 * You can remove any of the following modules if you don't need them.
 */
const extension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   * You ID can be anything you want, but it should be unique.
   */
  id,
  getCommandsModule,

  /**
   * PanelModule should provide a list of panels that will be available in OHIF
   * for Modes to consume and render. Each panel is defined by a {name,
   * iconName, iconLabel, label, component} object. Example of a panel module
   * is the StudyBrowserPanel that is provided by the default extension in OHIF.
   */
  getViewportModule({
    servicesManager,
    extensionManager,
    commandsManager,
  }: Types.Extensions.ExtensionParams) {
    const ExtendedOHIFCornerstoneRTViewport = props => {
      return (
        <OHIFCornerstoneRTViewport
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          commandsManager={commandsManager}
          {...props}
        />
      );
    };

    return [{ name: 'dicom-rt', component: ExtendedOHIFCornerstoneRTViewport }];
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
