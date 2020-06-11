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

function getViewportModule({ commandsManager }) {
  return [{ name: 'cornerstone-tracked', component: OHIFCornerstoneViewport }];
}

export default getViewportModule;
