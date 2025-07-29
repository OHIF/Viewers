import React from 'react';
import { ExtensionManager } from '@ohif/core';
import { OHIFCornerstoneSRContainer } from './OHIFCornerstoneSRContainer';

interface OHIFCornerstoneSRTextViewportProps {
  displaySets?: object[];
  viewportId: string;
  dataSource?: object;
  children?: React.ReactNode;
  viewportLabel?: string;
  viewportOptions?: object;
  servicesManager: object;
  extensionManager: ExtensionManager;
}

function OHIFCornerstoneSRTextViewport(props: OHIFCornerstoneSRTextViewportProps) {
  const { displaySets } = props;
  const displaySet = displaySets[0];
  const instance = displaySet.instances[0];

  return (
    <div className="relative flex h-full w-full flex-col overflow-auto p-4 text-white">
      <div>
        {/* The root level is always a container */}
        <OHIFCornerstoneSRContainer container={instance} />
      </div>
    </div>
  );
}

export default OHIFCornerstoneSRTextViewport;
