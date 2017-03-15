import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(function() {
    StudyList.callbacks.dblClickOnStudy = dblClickOnStudy;
    StudyList.callbacks.middleClickOnStudy = dblClickOnStudy;

    StudyList.timepointApi = new OHIF.measurements.TimepointApi();
    StudyList.timepointApi.retrieveTimepoints();
});

/**
 * Lesion Tracker method including Timepoints / other studies
 */
const dblClickOnStudy = data => {
    // Find the relevant timepoint given the clicked-on study
    const timepointApi = StudyList.timepointApi;
    if (!timepointApi) {
        OHIF.log.warn('No timepoint api on dbl-clicked study?');
        return;
    }

    const timepoint = timepointApi.study(data.studyInstanceUid)[0];
    if (timepoint) {
        OHIF.lesiontracker.openNewTabWithTimepoint(timepoint.timepointId);
    } else {
        openTab(data.studyInstanceUid);
    }
};

/**
 * Opens a study
 *
 * @param studyInstanceUid The UID of the Study to be opened
 * @param title The title to be used for the tab heading
 */
const openTab = studyInstanceUid => {
    const contentId = 'viewerTab';

    ViewerData = window.ViewerData || ViewerData;

    // Update the ViewerData global object
    ViewerData[contentId] = {
        contentId: contentId,
        isUnassociatedStudy: true,
        studyInstanceUids: [studyInstanceUid]
    };

    // Switch to the new tab
    switchToTab(contentId);
};
