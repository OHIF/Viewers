import React from 'react';
import OHIFDicomHtmlSopClassHandler from './OHIFDicomHtmlSopClassHandler.js';
import { ErrorBoundary } from '@ohif/ui';

const Component = React.lazy(() => {
  return import('./OHIFDicomHtmlViewport');
});

const OHIFDicomHtmlViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ErrorBoundary context='OHIFDicomHtmlViewport'>
        <Component {...props} />
      </ErrorBoundary>
    </React.Suspense>
  );
};

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'html',

  getViewportModule() {
    return OHIFDicomHtmlViewport;
  },
  getSopClassHandlerModule() {
    return OHIFDicomHtmlSopClassHandler;
  },
};
