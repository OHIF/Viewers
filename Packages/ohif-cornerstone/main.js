/**
 * Import namespace...
 */

import { OHIF } from './namespace.js';

/**
 * Import scripts that will populate the Cornerstone namespace as a side effect only import. This is effectively the public API...
 */

import * as cornerstone from 'cornerstone-core';
import * as cornerstoneTools from 'cornerstone-tools';
import * as cornerstoneMath from 'cornerstone-math';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dicomParser from 'dicom-parser';
import Hammer from 'hammerjs';

import './client/'; // which is actually: import './client/index.js';

// Inject the current cornerstone version into the
// WADO Image Loader and Tools libraries
//
// Note: You would also need to do this with Cornerstone Web Image Loader
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

export {
    cornerstone,
    cornerstoneTools,
    cornerstoneMath,
    cornerstoneWADOImageLoader,
    dicomParser
};

export { OHIF };
