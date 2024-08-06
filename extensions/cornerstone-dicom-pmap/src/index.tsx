import { id } from './id';
import React from 'react';
import getSopClassHandlerModule from './getSopClassHandlerModule';

const Component = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './viewports/OHIFCornerstonePMAPViewport');
});

const OHIFCornerstonePMAPViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

/**
 * You can remove any of the following modules if you don't need them.
 */
const extension = {
  id,
  getViewportModule({ servicesManager, extensionManager, commandsManager }) {
    const ExtendedOHIFCornerstonePMAPViewport = props => {
      return (
        <OHIFCornerstonePMAPViewport
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          commandsManager={commandsManager}
          {...props}
        />
      );
    };

    return [{ name: 'dicom-pmap', component: ExtendedOHIFCornerstonePMAPViewport }];
  },
  getSopClassHandlerModule,
};

export default extension;
