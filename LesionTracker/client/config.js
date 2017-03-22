import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { OHIF } from 'meteor/ohif:core';
import { cornerstoneWADOImageLoader } from 'meteor/ohif:cornerstone';

Meteor.startup(function() {
	const maxWebWorkers = Math.max(navigator.hardwareConcurrency - 1, 1);
    const config = {
	    maxWebWorkers: maxWebWorkers,	
    	startWebWorkersOnDemand: true,
        webWorkerPath : OHIF.utils.absoluteUrl('packages/ohif_cornerstone/public/js/cornerstoneWADOImageLoaderWebWorker.es5.js'),
        taskConfiguration: {
            'decodeTask' : {
		        loadCodecsOnStartup : true,
		        initializeCodecsOnStartup: false,
                codecsPath: OHIF.utils.absoluteUrl('packages/ohif_cornerstone/public/js/cornerstoneWADOImageLoaderCodecs.es5.js'),
                usePDFJS: false
            }
        }
    };

    cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

    cornerstoneWADOImageLoader.configure({
        beforeSend: function(xhr) {
            const userId = Meteor.userId();
            const loginToken = Accounts._storedLoginToken();
            if (userId && loginToken) {
                xhr.setRequestHeader("x-user-id", userId);
                xhr.setRequestHeader("x-auth-token", loginToken);
            }
        }
    });
});