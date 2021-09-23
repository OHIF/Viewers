/**
 * Entry point for development and production PWA builds.
 */
import 'regenerator-runtime/runtime';
import App from './App.jsx';

import OHIFDefaultExtension from '@ohif/extension-default';
import OHIFCornerstoneExtension from '@ohif/extension-cornerstone';
import OHIFMeasurementTrackingExtension from '@ohif/extension-measurement-tracking';
import OHIFDICOMSRExtension from '@ohif/extension-dicom-sr';

export {
  OHIFDefaultExtension,
  OHIFCornerstoneExtension,
  OHIFMeasurementTrackingExtension,
  OHIFDICOMSRExtension,
};
export default App;
