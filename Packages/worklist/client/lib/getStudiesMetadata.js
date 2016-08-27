/**
 * Retrieves metaData for multiple studies at once.
 *
 * This function calls getStudyMetadata several times, asynchronously,
 * and waits for all of the results to be returned.
 *
 * @param studyInstanceUids The UIDs of the Studies to be retrieved
 * @param doneCallback The callback function to be executed when the study retrieval has finished
 * @param failCallback The callback function to be executed when the study retrieval has failed
 */
getStudiesMetadata = function(studyInstanceUids, doneCallback, failCallback) {
    // Check to make sure studyInstanceUids were actually input
    if (!studyInstanceUids || !studyInstanceUids.length) {
        if (failCallback && typeof failCallback === 'function') {
            failCallback('No studyInstanceUids were input');
        }

        return;
    }

    // Create an empty array to store the Promises for each metaData
    // retrieval call
    var promises = [];

    // Loop through the array of studyInstanceUids
    studyInstanceUids.forEach(function(studyInstanceUid) {
        // Create a new Deferred to monitor the progress of the asynchronous
        // metaData retrieval
        var deferred = new $.Deferred();

        // Send the call, and attach doneCallbacks and failCallbacks
        // which can resolve or reject the related promise based on its outcome
        getStudyMetadata(studyInstanceUid, function(study) {
            deferred.resolve(study);
        }, function(error) {
            deferred.reject(error);
        });

        // Add the current promise to the array of promises
        promises.push(deferred.promise());
    });

    // When all of the promises are complete, this callback runs
    $.when.apply($, promises).done(function() {
        // Convert the Arguments Array-like Object to an actual array
        var studies = $.makeArray(arguments);

        // Pass the studies array to the doneCallback, if one exists
        if (doneCallback && typeof doneCallback === 'function') {
            doneCallback(studies);
        }
    }).fail(function(error) {
        log.warn(error);
        if (failCallback && typeof failCallback === 'function') {
            failCallback(error);
        }
    });
};