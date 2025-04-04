import PropTypes from 'prop-types';
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

OHIFCornerstoneSRViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportId: PropTypes.string.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
  viewportLabel: PropTypes.string,
  viewportOptions: PropTypes.object,
  servicesManager: PropTypes.object.isRequired,
  extensionManager: PropTypes.instanceOf(ExtensionManager).isRequired,
};

export default OHIFCornerstoneSRViewport;
