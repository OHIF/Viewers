import React from 'react';
import { ExtensionManager } from '@ohif/core';

import OHIFCornerstoneSRMeasurementViewport from './OHIFCornerstoneSRMeasurementViewport';
import OHIFCornerstoneSRTextViewport from './OHIFCornerstoneSRTextViewport';

function OHIFCornerstoneSRViewport(props: withAppTypes) {
  const { displaySets } = props;
  const { isImagingMeasurementReport } = displaySets[0];

  if (isImagingMeasurementReport) {
    return <OHIFCornerstoneSRMeasurementViewport {...props}></OHIFCornerstoneSRMeasurementViewport>;
  }

  return <OHIFCornerstoneSRTextViewport {...props}></OHIFCornerstoneSRTextViewport>;
}



export default OHIFCornerstoneSRViewport;
