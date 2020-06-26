import React from 'react';

const Component = React.lazy(() => {
  return import('./viewports/TrackedCornerstoneViewport');
});

const TrackedOHIFCornerstoneViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

function getViewportModule({ servicesManager }) {
  const WrappedTrackedOHIFCornerstoneViewport = props => {
    return (
      <TrackedOHIFCornerstoneViewport
        {...props}
        servicesManager={servicesManager}
      />
    );
  };

  return [
    {
      name: 'cornerstone-tracked',
      component: WrappedTrackedOHIFCornerstoneViewport,
    },
  ];
}

export default getViewportModule;
