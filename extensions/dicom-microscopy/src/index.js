import React from 'react';
import getSopClassHandlerModule from './getSopClassHandlerModule.js';

const Component = React.lazy(() => {
  return import('./DicomMicroscopyViewport');
});

const DicomMicroscopyViewport = props => {
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
  id: 'org.ohif.microscopy',

  getViewportModule() {
    return [
      {
        name: 'microscopy-default',
        component: DicomMicroscopyViewport,
      },
    ];
  },
  getSopClassHandlerModule
};
