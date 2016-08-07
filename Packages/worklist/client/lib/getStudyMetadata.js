// Define the StudyMetaData object. This is used as a cache
// to store study meta data information to prevent unnecessary
// calls to the server
var StudyMetaData = {};

/**
 * Retrieves study metadata using a server call, and fires a callback
 * when completed.
 *
 * @params {string} studyInstanceUid The UID of the Study to be retrieved
 * @params {function} doneCallback The callback function to be executed when the study retrieval has finished
 * @param failCallback The callback function to be executed when the study retrieval has failed
 */
getStudyMetadata = function(studyInstanceUid, doneCallback, failCallback) {
    // If the StudyMetaData cache already has data related to this
    // studyInstanceUid, then we should fire the doneCallback with this data
    // and stop here.
    var study = StudyMetaData[studyInstanceUid];
    if (study) {
        doneCallback(study);
        return;
    }
    
    console.time('getStudyMetadata');

    // If no study metadata is in the cache variable, we need to retrieve it from
    // the server with a call.
    Meteor.call('GetStudyMetadata', studyInstanceUid, function(error, study) {
        console.timeEnd('getStudyMetadata');

        if (Meteor.user && Meteor.user()) {
            var hipaaEvent = {
                eventType: 'viewed',
                userId: Meteor.userId(),
                userName: Meteor.user().profile.fullName,
                collectionName: 'Study',
                recordId: studyInstanceUid,
                patientId: study.patientId,
                patientName: study.patientName
            };
            HipaaLogger.logEvent(hipaaEvent);
        }

        if (error) {
            log.warn(error);
            failCallback(error);
            return;
        }

        if (!study) {
            throw "GetStudyMetadata: No study data returned from server";
        }

        // Once we have retrieved the data, we sort the series' by series
        // and instance number in ascending order
        sortStudy(study);

        // Add additional metadata to our study from the worklist
        var worklistStudy = WorklistStudies.findOne({
            studyInstanceUid: study.studyInstanceUid
        });

        if (!worklistStudy) {
            return;
        }

        $.extend(study, worklistStudy);

        // Then we store this data in the cache variable
        StudyMetaData[studyInstanceUid] = study;

        // Finally, we fire the doneCallback with this study meta data
        doneCallback(study);
    });
};
