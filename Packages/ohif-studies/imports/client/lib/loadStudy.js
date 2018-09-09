import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';
import { Meteor } from "meteor/meteor";

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

    const studyLoaded = OHIF.viewer.Studies.findBy({ studyInstanceUid: studyInstanceUid });
    if (studyLoaded) {
        OHIF.studies.loadingDict.set(studyInstanceUid, 'loaded');
        resolve(studyLoaded);
        return;
    }

    return OHIF.studies.retrieveStudyMetadata(studyInstanceUid).then(study => {
        if (window.HipaaLogger &&
            OHIF.user &&
            OHIF.user.userLoggedIn &&
            OHIF.user.userLoggedIn()) {
            window.HipaaLogger.logEvent({
                eventType: 'viewed',
                userId: OHIF.user.getUserId(),
                userName: OHIF.user.getName(),
                collectionName: 'Study',
                recordId: studyInstanceUid,
                patientId: study.patientId,
                patientName: study.patientName
            });
        }

        // Once the data was retrieved, the series are sorted by series and instance number
        OHIF.viewerbase.sortStudy(study);

        // Updates WADO-RS metaDataManager
        OHIF.viewerbase.updateMetaDataManager(study);

        // Transform the study in a StudyMetadata object
        const studyMetadata = new OHIF.metadata.StudyMetadata(study);

        // Add the display sets to the study
        study.displaySets = OHIF.viewerbase.sortingManager.getDisplaySets(studyMetadata);
        study.displaySets.forEach(displaySet => {
            OHIF.viewerbase.stackManager.makeAndAddStack(study, displaySet);
            studyMetadata.addDisplaySet(displaySet);
        });

        // Persist study data into OHIF.viewer
        OHIF.viewer.Studies.insert(study);
        OHIF.viewer.StudyMetadataList.insert(study);

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
