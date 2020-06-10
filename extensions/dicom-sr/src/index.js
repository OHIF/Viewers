import React from 'react';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import id from './id.js';
import init from './init';

const Component = React.lazy(() => {
  return import('./OHIFCornerstoneSRViewport');
});

const OHIFCornerstoneSRViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

/**
 *
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  preRegistration({ servicesManager, configuration = {} }) {
    init({ servicesManager, configuration });
  },

  /**
   *
   *
   * @param {object} [configuration={}]
   * @param {object|array} [configuration.csToolsConfig] - Passed directly to `initCornerstoneTools`
   */
  getViewportModule({ servicesManager }) {
    const ExtendedOHIFCornerstoneSRViewport = props => {
      const { DisplaySetService } = servicesManager.services;

      return (
        <OHIFCornerstoneSRViewport
          DisplaySetService={DisplaySetService}
          {...props}
        />
      );
    };

    return [{ name: 'dicom-sr', component: ExtendedOHIFCornerstoneSRViewport }];
  },
  getSopClassHandlerModule,
};
