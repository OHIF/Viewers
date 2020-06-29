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
  dependencies: [
    // TODO -> This isn't used anywhere yet, but we do have a hard dependency, and need to check for these in the future.
    {
      id: 'org.ohif.cornerstone',
      version: '3.0.0',
    },
  ],

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
      return (
        <OHIFCornerstoneSRViewport
          servicesManager={servicesManager}
          {...props}
        />
      );
    };

    return [{ name: 'dicom-sr', component: ExtendedOHIFCornerstoneSRViewport }];
  },
  getSopClassHandlerModule,
};
