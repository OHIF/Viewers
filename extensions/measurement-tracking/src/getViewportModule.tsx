import React from 'react';

const Component = React.lazy(() => {
  return import(/* webpackPrefetch: true */ './viewports/TrackedCornerstoneViewport');
});

const OHIFCornerstoneViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

function getViewportModule({ servicesManager, commandsManager, extensionManager }) {
  const ExtendedOHIFCornerstoneTrackingViewport = props => {
    return (
      <OHIFCornerstoneViewport
        servicesManager={servicesManager}
        commandsManager={commandsManager}
        extensionManager={extensionManager}
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
