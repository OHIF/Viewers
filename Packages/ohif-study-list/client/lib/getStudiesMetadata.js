import { OHIF } from 'meteor/ohif:core';

/**
 * Retrieves metaData for multiple studies at once.
 *
 * This function calls retrieveStudyMetadata several times, asynchronously,
 * and waits for all of the results to be returned.
 *
 * @param studyInstanceUids The UIDs of the Studies to be retrieved
 * @param doneCallback The callback function to be executed when the study retrieval has finished
 * @param failCallback The callback function to be executed when the study retrieval has failed
 */
OHIF.studylist.getStudiesMetadata = (studyInstanceUids, doneCallback, failCallback) => {
    // Check to make sure studyInstanceUids were actually input
    if (!studyInstanceUids || !studyInstanceUids.length) {
        if (failCallback && typeof failCallback === 'function') {
            failCallback('No studyInstanceUids were input');
        }

        return;
    }

    // Create an empty array to store the Promises for each metaData
    // retrieval call
    const promises = [];

    // Loop through the array of studyInstanceUids
    studyInstanceUids.forEach(function(studyInstanceUid) {
        // Send the call, and attach doneCallbacks and failCallbacks
        // which can resolve or reject the related promise based on its outcome
        const promise = OHIF.studylist.retrieveStudyMetadata(studyInstanceUid);

        // Add the current promise to the array of promises
        promises.push(promise);
    });

    // When all of the promises are complete, this callback runs
    Promise.all(promises).then(studies => {
        // Pass the studies array to the doneCallback, if one exists
        if (doneCallback && typeof doneCallback === 'function') {
            doneCallback(studies);
        }
    }).catch(error => {
        OHIF.log.warn(error);
        if (failCallback && typeof failCallback === 'function') {
            failCallback(error);
        }
    });
};
