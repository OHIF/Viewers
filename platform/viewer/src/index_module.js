import React, { useContext, useEffect } from 'react';

import OHIFDefaultExtension from '@ohif/extension-default';
import OHIFCornerstoneExtension from '@ohif/extension-cornerstone';
import OHIFMeasurementTrackingExtension from '@ohif/extension-measurement-tracking';
import OHIFDICOMSRExtension from '@ohif/extension-dicom-sr';

import App from './App.jsx';
import appConfig from '../public/config/newlantern';

const appProps = {
  config: appConfig,
  defaultExtensions: [
    OHIFDefaultExtension,
    OHIFCornerstoneExtension,
    OHIFMeasurementTrackingExtension,
    OHIFDICOMSRExtension,
  ],
};

const LanternViewer = ({ accessToken, studyUID }) => (
  <App {...appProps} accessToken={accessToken} studyUID={studyUID} />
);

export default LanternViewer;
