import React from 'react';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import { id } from './id';

const Component = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './viewports/OHIFCornerstoneEcgViewport');
});

const OHIFCornerstoneEcgViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

const dicomEcgExtension = {
  id,

  getViewportModule({ servicesManager, extensionManager }) {
    const ExtendedOHIFCornerstoneEcgViewport = props => {
      return (
        <OHIFCornerstoneEcgViewport
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          {...props}
        />
      );
    };

    return [{ name: 'dicom-ecg', component: ExtendedOHIFCornerstoneEcgViewport }];
  },

  getSopClassHandlerModule,
};

export default dicomEcgExtension;
