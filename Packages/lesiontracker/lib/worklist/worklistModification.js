Meteor.startup(function() {
    Worklist.subscriptions = ['studies', 'timepoints'];
    Worklist.callbacks['dblClickOnStudy'] = dblClickOnStudy;
    Worklist.callbacks['middleClickOnStudy'] = dblClickOnStudy;
});

/**
 * Lesion Tracker method including Timepoints / other studies
 */
function dblClickOnStudy(data) {
    // Use the formatPN template helper to clean up the patient name
    var title = formatPN(data.patientName);
    var study = Studies.findOne({
        studyInstanceUid: data.studyInstanceUid
    });

    // Check if the study has been associated, and if not, just open it on its own
    if (!study) {
        // Open a new tab with this study
        openNewTab(data.studyInstanceUid, title);
        return;
    }

    // Find the relevant timepoint given the clicked-on study
    var timepoint = Timepoints.findOne({
        studyInstanceUids: {
            $in: [data.studyInstanceUid]
        }
    });

    if (!timepoint) {
        openNewTab(data.studyInstanceUid, title);
        return;
    }

    // Add the Timepoint name to the Patient name to create the tab title
    title += ' ' + getTimepointName(timepoint);

    openNewTabWithTimepoint(timepoint.timepointId, title);
}