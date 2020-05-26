import React from 'react';

const Component = React.lazy(() => {
  return import('./Viewports/OHIFCornerstoneViewport');
});

const OHIFCornerstoneViewport = props => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

function getViewportModule({ commandsManager }) {
  const ExtendedOHIFCornerstoneViewport = props => {
    const onNewImageHandler = jumpData => {
      alert('here we are!')
      commandsManager.runCommand('jumpToImage', jumpData);
    };
    return (
      <OHIFCornerstoneViewport {...props} onNewImage={onNewImageHandler} />
    );
  };

  return [
    { name: 'cornerstone-tracked', component: ExtendedOHIFCornerstoneViewport },
  ];
};

export default getViewportModule;
