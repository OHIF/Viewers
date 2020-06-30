import React from 'react';

const Component = React.lazy(() => {
  return import('./viewports/TrackedCornerstoneViewport');
});

const OHIFCornerstoneViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

function getViewportModule({ servicesManager }) {
  const ExtendedOHIFCornerstoneSRViewport = props => {
    const { ToolBarService } = servicesManager.services;

    return (
      <OHIFCornerstoneViewport
        ToolBarService={ToolBarService}
        {...props}
      />
    );
  };

  return [{ name: 'cornerstone-tracked', component: ExtendedOHIFCornerstoneSRViewport }];
}

export default getViewportModule;
