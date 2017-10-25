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
import { $ } from 'meteor/jquery';
import Hammer from 'hammerjs';

import './client/'; // which is actually: import './client/index.js';

// Inject the current cornerstone version into the
// WADO Image Loader and Tools libraries
//
// Note: You would also need to do this with Cornerstone Web Image Loader
cornerstone.external.$ = $;
cornerstoneTools.external.$ = $;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;

export {
    cornerstone,
    cornerstoneTools,
    cornerstoneMath,
    cornerstoneWADOImageLoader,
    dicomParser
};

export { OHIF };
