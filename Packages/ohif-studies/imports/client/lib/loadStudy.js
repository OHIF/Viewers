import { OHIF } from 'meteor/ohif:core';

/**
 * Load the study metadata and store its information locally
 *
 * @param {String} studyInstanceUid The UID of the Study to be loaded
 * @returns {Promise} that will be resolved with the study metadata or rejected with an error
 */
OHIF.studies.loadStudy = studyInstanceUid => new Promise((resolve, reject) => {
    OHIF.studies.retrieveStudyMetadata(studyInstanceUid).then(study => {
        // Double check to make sure this study wasn't already inserted into OHIF.viewer.Studies
        // so we don't cause duplicate entry errors
        const loaded = OHIF.viewer.Studies.findBy({ studyInstanceUid: study.studyInstanceUid });
        if (!loaded) {
            OHIF.viewer.Studies.insert(study);
        }

        resolve(study);
    }).catch(reject);
});
