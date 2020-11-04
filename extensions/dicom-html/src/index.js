import React from 'react';
import OHIFDicomHtmlSopClassHandler from './OHIFDicomHtmlSopClassHandler.js';
import { version } from '../package.json';

const Component = React.lazy(() => {
  return import('./OHIFDicomHtmlViewport');
});

const OHIFDicomHtmlViewport = props => {
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
  id: 'html',
  version,

  getViewportModule() {
    return OHIFDicomHtmlViewport;
  },
  getSopClassHandlerModule() {
    return OHIFDicomHtmlSopClassHandler;
  },
};
