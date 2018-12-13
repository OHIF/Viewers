import { OHIF } from 'meteor/ohif:core';

/**
 * Retrieves metaData for multiple studies at once.
 *
 * This function calls retrieveStudyMetadata several times, asynchronously,
 * and waits for all of the results to be returned.
 *
 * @param studyInstanceUids The UIDs of the Studies to be retrieved
 * @return Promise
 */
OHIF.studies.retrieveStudiesMetadata = (studyInstanceUids, seriesInstanceUids) => {
    // Create an empty array to store the Promises for each metaData retrieval call
    const promises = [];

    // Loop through the array of studyInstanceUids
    studyInstanceUids.forEach(function(studyInstanceUid) {
        // Send the call and resolve or reject the related promise based on its outcome
        const promise = OHIF.studies.retrieveStudyMetadata(studyInstanceUid, seriesInstanceUids);

        // Add the current promise to the array of promises
        promises.push(promise);
    });

    // When all of the promises are complete, this callback runs
    const promise = Promise.all(promises);

    // Warn the error on console if some retrieval failed
    promise.catch(error => OHIF.log.warn(error));

    return promise;
};
