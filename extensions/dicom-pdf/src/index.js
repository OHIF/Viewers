import React from 'react';
import OHIFDicomPDFSopClassHandler from './OHIFDicomPDFSopClassHandler.js';

const Component = React.lazy(() => {
  return import('./ConnectedOHIFDicomPDFViewer');
});

const ConnectedOHIFDicomPDFViewer = props => {
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
  id: 'pdf',
  getViewportModule() {
    return ConnectedOHIFDicomPDFViewer;
  },
  getSopClassHandlerModule() {
    return OHIFDicomPDFSopClassHandler;
  },
};
