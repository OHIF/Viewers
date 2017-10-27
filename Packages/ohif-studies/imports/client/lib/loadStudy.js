import { ReactiveDict } from 'meteor/reactive-dict';
import { OHIF } from 'meteor/ohif:core';

// Create a studies loaded state dictionary to enable reactivity
OHIF.studies.loadedDict = new ReactiveDict();

/**
 * Load the study metadata and store its information locally
 *
 * @param {String} studyInstanceUid The UID of the Study to be loaded
 * @returns {Promise} that will be resolved with the study metadata or rejected with an error
 */
OHIF.studies.loadStudy = studyInstanceUid => new Promise((resolve, reject) => {
    OHIF.studies.retrieveStudyMetadata(studyInstanceUid).then(study => {
        // Add the display sets to the study if not present
        if (!study.displaySets) {
            const displaySets = OHIF.viewerbase.sortingManager.getDisplaySets(study);
            study.displaySets = displaySets;
            study.setDisplaySets(displaySets);
            study.forEachDisplaySet(displaySet => {
                OHIF.viewerbase.stackManager.makeAndAddStack(study, displaySet);
            });
        }

        // Double check to make sure this study wasn't already inserted into OHIF.viewer.Studies
        // so we don't cause duplicate entry errors
        const loaded = OHIF.viewer.Studies.findBy({ studyInstanceUid: study.studyInstanceUid });
        if (!loaded) {
            OHIF.viewer.Studies.insert(study);
            OHIF.viewer.StudyMetadataList.insert(study);
        }

        // Add the studyInstanceUid to the loaded state dictionary
        OHIF.studies.loadedDict.set(study.studyInstanceUid, true);

        resolve(study);
    }).catch(reject);
});
