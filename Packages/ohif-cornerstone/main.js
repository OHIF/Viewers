// TODO: stop exposing the libraries below and start using imports

import { cornerstone } from './client/cornerstone.js';
import { dicomParser } from './client/dicomParser.js';
import { cornerstoneMath } from './client/cornerstoneMath.js';
import { cornerstoneTools } from './client/cornerstoneTools.js';
import { cornerstoneWADOImageLoader } from './client/cornerstoneWADOImageLoader.js';

// Expose the cornerstone objects to the client if it is on development mode
if (Meteor.isDevelopment) {
    window.cornerstone = cornerstone;
    window.cornerstoneMath = cornerstoneMath;
    window.cornerstoneTools = cornerstoneTools;
    window.cornerstoneWADOImageLoader = cornerstoneWADOImageLoader;
    window.dicomParser = dicomParser;
}

export {
    cornerstone,
    cornerstoneMath,
    cornerstoneTools,
    cornerstoneWADOImageLoader,
    dicomParser
};
