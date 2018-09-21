import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';
import { cornerstoneWADOImageLoader } from 'meteor/ohif:cornerstone';
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader';
import { TAPi18n } from 'meteor/tap:i18n';

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
    TAPi18n.setLanguage('es');
    cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
    cornerstoneWebImageLoader.external.cornerstone = cornerstone;
});
