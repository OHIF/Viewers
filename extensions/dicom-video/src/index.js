import React from 'react';
import DICOMVideoSopClassHandler from './DICOMVideoSopClassHandler.js';
import commandsModule from './commandsModule';
import init from './init.js';
import { version } from '../package.json';

const Component = React.lazy(() => {
  return import('./ConnectedDICOMVideoViewport');
});

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'video',
  version,

  preRegistration({ servicesManager }) {
    init({ servicesManager });
  },
  getViewportModule({ servicesManager }) {
    return props => {
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <Component {...props} servicesManager={servicesManager} />
        </React.Suspense>
      );
    };
  },
  getSopClassHandlerModule() {
    return [DICOMVideoSopClassHandler];
  },
  getToolbarModule() {},
  getCommandsModule() {
    return commandsModule();
  },
  getPanelModule({ appConfig, servicesManager }) {},
};
