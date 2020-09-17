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

function getViewportModule({ servicesManager, commandsManager }) {
  const ExtendedOHIFCornerstoneTrackingViewport = props => {
    return (
      <OHIFCornerstoneViewport
        servicesManager={servicesManager}
        commandsManager={commandsManager}
        {...props}
      />
    );
  };

  return [
    {
      name: 'cornerstone-tracked',
      component: ExtendedOHIFCornerstoneTrackingViewport,
    },
  ];
}

export default getViewportModule;
