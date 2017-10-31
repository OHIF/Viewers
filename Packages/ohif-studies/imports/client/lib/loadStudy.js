import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';

// Create a studies loaded state dictionary to enable reactivity. Values: loading|loaded|failed
OHIF.studies.loadingDict = new ReactiveDict();

/**
 * Load the study metadata and store its information locally
 *
 * @param {String} studyInstanceUid The UID of the Study to be loaded
 * @returns {Promise} that will be resolved with the study metadata or rejected with an error
 */
OHIF.studies.loadStudy = studyInstanceUid => new Promise((resolve, reject) => {
    // Disable reactivity to get the current loading state
    let currentLoadingState;
    Tracker.nonreactive(() => {
        currentLoadingState = OHIF.studies.loadingDict.get(studyInstanceUid) || '';
    });

    // Set the loading state as the study is not yet loaded
    if (currentLoadingState !== 'loading') {
        OHIF.studies.loadingDict.set(studyInstanceUid, 'loading');
    }

    return OHIF.studies.retrieveStudyMetadata(studyInstanceUid).then(study => {
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

        // Add the study to the loading listener to allow loading progress handling
        const studyLoadingListener = OHIF.viewerbase.StudyLoadingListener.getInstance();
        studyLoadingListener.addStudy(study);

        // Add the studyInstanceUid to the loaded state dictionary
        OHIF.studies.loadingDict.set(studyInstanceUid, 'loaded');

        resolve(study);
    }).catch((...args) => {
        OHIF.studies.loadingDict.set(studyInstanceUid, 'failed');
        reject(args);
    });
});
