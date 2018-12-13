import Hammer from 'hammerjs';
import cornerstone from 'cornerstone-core';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import * as dcmjs from 'dcmjs/build/dcmjs';

cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

// Export scripts that will populate the Cornerstone namespace as a side effect only import.
// This is effectively the public API...
export {
    cornerstone,
    cornerstoneTools,
    cornerstoneMath,
    cornerstoneWADOImageLoader,
    dicomParser,
    dcmjs
};
