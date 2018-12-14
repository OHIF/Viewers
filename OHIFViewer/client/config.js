import { Meteor } from 'meteor/meteor';
import { OHIF } from 'ohif-core';
import { cornerstoneWADOImageLoader } from 'meteor/ohif:cornerstone';
import sha from './sha.js';
import version from './version.js';

OHIF.info = {
    sha,
    version
};

Meteor.startup(function() {
    const maxWebWorkers = Math.max(navigator.hardwareConcurrency - 1, 1);
    const config = {
        maxWebWorkers: maxWebWorkers,
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
});

if (Meteor.settings &&
    Meteor.settings.public &&
    Meteor.settings.public.clientOnly === true) {
    Meteor.disconnect();
}
