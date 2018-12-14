import { OHIF } from 'ohif-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import sha from './sha.js';
import version from './version.js';

OHIF.info = {
    sha,
    version
};


const maxWebWorkers = Math.max(navigator.hardwareConcurrency - 1, 1);
const config = {
    maxWebWorkers,
    startWebWorkersOnDemand: true,
    webWorkerPath: OHIF.utils.absoluteUrl('packages/ohif_cornerstone/public/js/cornerstoneWADOImageLoaderWebWorker.es5.js'),
    taskConfiguration: {
        decodeTask: {
            loadCodecsOnStartup: true,
            initializeCodecsOnStartup: false,
            codecsPath: OHIF.utils.absoluteUrl('packages/ohif_cornerstone/public/js/cornerstoneWADOImageLoaderCodecs.es5.js'),
            usePDFJS: false
        }
    }
};

cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

cornerstoneWADOImageLoader.configure({
    beforeSend: function(xhr) {
        const headers = OHIF.DICOMWeb.getAuthorizationHeader();

        if (headers.Authorization) {
            xhr.setRequestHeader("Authorization", headers.Authorization);
        }
    }
});
