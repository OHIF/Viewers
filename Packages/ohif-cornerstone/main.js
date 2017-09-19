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

import './client/'; // which is actually: import './client/index.js';

export {
    cornerstone,
    cornerstoneTools,
    cornerstoneMath,
    cornerstoneWADOImageLoader,
    dicomParser
};

export { OHIF };
