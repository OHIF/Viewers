import Hammer from 'hammerjs';
import cornerstone from 'cornerstone-core/dist/cornerstone.js';
import cornerstoneMath from 'cornerstone-math/dist/cornerstoneMath.js';
import cornerstoneTools from 'cornerstone-tools/dist/cornerstoneTools.js';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader/dist/cornerstoneWADOImageLoader.js';
import dicomParser from 'dicom-parser'; // Importing from dist breaks instance reference of dicomParser.DataSet class
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
