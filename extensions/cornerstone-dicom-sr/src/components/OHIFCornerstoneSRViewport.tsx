import React from 'react';
import { ExtensionManager } from '@ohif/core';

import OHIFCornerstoneSRMeasurementViewport from './OHIFCornerstoneSRMeasurementViewport';
import OHIFCornerstoneSRTextViewport from './OHIFCornerstoneSRTextViewport';

interface OHIFCornerstoneSRViewportProps {
  displaySets?: object[];
  viewportId: string;
  dataSource?: object;
  children?: React.ReactNode;
  viewportLabel?: string;
  viewportOptions?: object;
  servicesManager: object;
  extensionManager: ExtensionManager;
}

function OHIFCornerstoneSRViewport(props: OHIFCornerstoneSRViewportProps) {
  const { displaySets } = props;
  const { isImagingMeasurementReport } = displaySets[0];

  if (isImagingMeasurementReport) {
    return <OHIFCornerstoneSRMeasurementViewport {...props}></OHIFCornerstoneSRMeasurementViewport>;
  }

  return <OHIFCornerstoneSRTextViewport {...props}></OHIFCornerstoneSRTextViewport>;
}

export default OHIFCornerstoneSRViewport;
