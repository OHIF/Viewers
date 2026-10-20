import React from 'react';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import { id } from './id';

const Component = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './viewports/OHIFDicomVideoViewport');
});

const OHIFDicomVideoViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

/**
 *
 */
const dicomVideoExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  /**
   * A plain HTML5 video viewport, for modes that do not use the Cornerstone
   * viewport (which plays video through its own VIDEO viewport type).
   */
  getViewportModule() {
    return [{ name: 'dicom-video', component: OHIFDicomVideoViewport }];
  },
  getSopClassHandlerModule,
};

export default dicomVideoExtension;
