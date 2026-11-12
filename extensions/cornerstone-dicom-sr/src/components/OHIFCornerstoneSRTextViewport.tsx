import React from 'react';
import { ExtensionManager } from '@ohif/core';
import { OHIFCornerstoneSRContainer } from './OHIFCornerstoneSRContainer';

function OHIFCornerstoneSRTextViewport(props: withAppTypes) {
  const { displaySets } = props;
  const displaySet = displaySets[0];
  const instance = displaySet.instances[0];

  return (
    <div className="text-foreground relative flex h-full w-full flex-col overflow-auto p-4">
      <div>
        {/* The root level is always a container */}
        <OHIFCornerstoneSRContainer container={instance} />
      </div>
    </div>
  );
}



export default OHIFCornerstoneSRTextViewport;
