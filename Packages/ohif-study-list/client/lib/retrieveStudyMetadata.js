import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

// Define the StudyMetaDataPromises object. This is used as a cache to store study meta data
// promises and prevent unnecessary subsequent calls to the server
const StudyMetaDataPromises = new Map();

/**
 * Retrieves study metadata using a server call
 *
 * @param {String} studyInstanceUid The UID of the Study to be retrieved
 * @returns {Promise} that will be resolved with the metadata or rejected with the error
 */
OHIF.studylist.retrieveStudyMetadata = studyInstanceUid => {

    // @TODO: Whenever a study metadata request has failed, its related promise will be rejected once and for all
    // and further requests for that metadata will always fail. On failure, we probably need to remove the
    // corresponding promise from the "StudyMetaDataPromises" map...

    // If the StudyMetaDataPromises cache already has a pending or resolved promise related to the
    // given studyInstanceUid, then that promise is returned
    if (StudyMetaDataPromises.has(studyInstanceUid)) {
        return StudyMetaDataPromises.get(studyInstanceUid);
    }

    console.time('retrieveStudyMetadata');

    // Create a promise to handle the data retrieval
    const promise = new Promise((resolve, reject) => {
        // If no study metadata is in the cache variable, we need to retrieve it from
        // the server with a call.
        Meteor.call('GetStudyMetadata', studyInstanceUid, function(error, study) {
            console.timeEnd('retrieveStudyMetadata');

            if (Meteor.user && Meteor.user()) {
                HipaaLogger.logEvent({
                    eventType: 'viewed',
                    userId: Meteor.userId(),
                    userName: Meteor.user().profile.fullName,
                    collectionName: 'Study',
                    recordId: studyInstanceUid,
                    patientId: study.patientId,
                    patientName: study.patientName
                });
            }

            if (error) {
                OHIF.log.warn(error);
                reject(error);
                return;
            }

            if (!study) {
                throw new Meteor.Error('GetStudyMetadata', 'No study data returned from server');
            }

            // Once the data was retrieved, the series are sorted by series and instance number
            OHIF.viewerbase.sortStudy(study);

            // Updates WADO-RS metaDataManager
            OHIF.viewerbase.updateMetaDataManager(study);

            // Add additional metadata to our study from the studylist
            const studylistStudy = OHIF.studylist.collections.Studies.findOne({
                studyInstanceUid: study.studyInstanceUid
            });

            if (studylistStudy) {
                Object.assign(study, studylistStudy);
            }

            // Transform the study in a StudyMetadata object
            const studyMetadata = new OHIF.metadata.StudyMetadata(study);

            // Add the display sets to the study
            study.displaySets = OHIF.viewerbase.sortingManager.getDisplaySets(studyMetadata);
            study.displaySets.forEach(displaySet => {
                OHIF.viewerbase.stackManager.makeAndAddStack(study, displaySet);
            });

            // Resolve the promise with the final study metadata object
            resolve(study);
        });
    });

    // Store the promise in cache
    StudyMetaDataPromises.set(studyInstanceUid, promise);

    return promise;
};
