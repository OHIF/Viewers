import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(function() {
    OHIF.studylist.callbacks.dblClickOnStudy = dblClickOnStudy;
    OHIF.studylist.callbacks.middleClickOnStudy = dblClickOnStudy;

    OHIF.studylist.timepointApi = new OHIF.measurements.TimepointApi();
    OHIF.studylist.timepointApi.retrieveTimepoints();
});

/**
 * Lesion Tracker method including Timepoints / other studies
 */
const dblClickOnStudy = data => {
    // Find the relevant timepoint given the clicked-on study
    const timepointApi = OHIF.studylist.timepointApi;
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

    // Update the OHIF.viewer.data global object
    OHIF.viewer.data = {
        contentId: contentId,
        isUnassociatedStudy: true,
        studyInstanceUids: [studyInstanceUid]
    };

    // Switch to the new tab
    switchToTab(contentId);
};
