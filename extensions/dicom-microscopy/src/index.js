import React from 'react';
import DicomMicroscopySopClassHandler from './DicomMicroscopySopClassHandler.js';
import { ErrorBoundary } from '@ohif/ui';

const Component = React.lazy(() => {
  return import('./DicomMicroscopyViewport');
});

const DicomMicroscopyViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ErrorBoundary context='DicomMicroscopyViewport'>
        <Component {...props} />
      </ErrorBoundary>
    </React.Suspense>
  );
};

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'microscopy',

  getViewportModule() {
    return DicomMicroscopyViewport;
  },
  getSopClassHandlerModule() {
    return DicomMicroscopySopClassHandler;
  },
};
