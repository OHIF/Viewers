import React from 'react';
import OHIFDicomECGSopClassHandler from './OHIFDicomECGSopClassHandler.js';
import { version } from '../package.json';

const Component = React.lazy(() => {
  return import('./ConnectedOHIFDicomECGViewer');
});

const ConnectedOHIFDicomECGViewer = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'ecg',
  version,
  getViewportModule() {
    return ConnectedOHIFDicomECGViewer;
  },
  getSopClassHandlerModule() {
    return OHIFDicomECGSopClassHandler;
  },
};
