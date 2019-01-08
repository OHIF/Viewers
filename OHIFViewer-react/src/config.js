import dicomParser from 'dicom-parser';
import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import cornerstoneMath from 'cornerstone-math';
import cornerstoneTools from 'cornerstone-tools';
import Hammer from 'hammerjs';
import OHIF from 'ohif-core';
import sha from './sha.js';
import version from './version.js';
import { homepage } from '../package.json';

window.info = {
    sha,
    version,
    homepage
};

// For debugging
window.cornerstone = cornerstone;
window.cornerstoneTools = cornerstoneTools;
window.cornerstoneWADOImageLoader = cornerstoneWADOImageLoader;

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.init();

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

OHIF.external.cornerstone = cornerstone;
OHIF.external.cornerstoneTools = cornerstoneTools;
OHIF.external.cornerstoneWADOImageLoader = cornerstoneWADOImageLoader;

// TODO: Is there a better way to guess ROOT_URL?
let ROOT_URL = homepage;

// If the page we are on is not a subset of the expected homepage
// provided in the package.json file, we might be doing local development.
// In this case, set the base URL to the current location's origin.
if (homepage.includes(window.location.origin) === false) {
    ROOT_URL = window.location.origin;
}

const config = {
    maxWebWorkers: Math.max(navigator.hardwareConcurrency - 1, 1),
    startWebWorkersOnDemand: true,
    webWorkerPath: ROOT_URL + '/cornerstoneWADOImageLoaderWebWorker.min.js',
    taskConfiguration: {
        decodeTask: {
            loadCodecsOnStartup: true,
            initializeCodecsOnStartup: false,
            codecsPath: ROOT_URL + '/cornerstoneWADOImageLoaderCodecs.min.js',
            usePDFJS: false,
            strict: false
        }
    }
};

cornerstoneWADOImageLoader.webWorkerManager.initialize(config);


OHIF.user.getAccessToken = () => {
    // TODO: Get the Redux store from somewhere else
    const state = window.store.getState();
    if (!state.oidc || !state.oidc.user) {
        return;
    }

    return state.oidc.user.access_token;
}

cornerstoneWADOImageLoader.configure({
    beforeSend: function(xhr) {
        const headers = OHIF.DICOMWeb.getAuthorizationHeader();

        if (headers.Authorization) {
            xhr.setRequestHeader("Authorization", headers.Authorization);
        }
    }
});

// Set the tool font and font size
// context.font = "[style] [variant] [weight] [size]/[line height] [font family]";
const fontFamily =
    'Roboto, OpenSans, HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif';
cornerstoneTools.textStyle.setFont(`16px ${fontFamily}`);

// Set the tool width
cornerstoneTools.toolStyle.setToolWidth(2);
// Set color for inactive tools
cornerstoneTools.toolColors.setToolColor('rgb(255, 255, 0)');

// Set color for active tools
cornerstoneTools.toolColors.setActiveColor('rgb(0, 255, 0)');

cornerstoneTools.store.state.touchProximity = 40;
