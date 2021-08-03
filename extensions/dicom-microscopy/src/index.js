import React from 'react';
import DicomMicroscopySopClassHandler from './DicomMicroscopySopClassHandler.js';
import { version } from '../package.json';

const Component = React.lazy(() => {
  return import('./DicomMicroscopyViewport');
});

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'microscopy',
  version,

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
    return DicomMicroscopySopClassHandler;
  },
};
