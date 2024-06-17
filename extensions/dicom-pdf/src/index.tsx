import React from 'react';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import { id } from './id.js';

const Component = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './viewports/OHIFCornerstonePdfViewport');
});

const OHIFCornerstonePdfViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

/**
 *
 */
const dicomPDFExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  getViewportModule({ servicesManager, extensionManager }) {
    const ExtendedOHIFCornerstonePdfViewport = props => {
      return (
        <OHIFCornerstonePdfViewport
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          {...props}
        />
      );
    };

    return [{ name: 'dicom-pdf', component: ExtendedOHIFCornerstonePdfViewport }];
  },
  getSopClassHandlerModule,
};

export default dicomPDFExtension;
