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
        open(data.studyInstanceUid, title);
        return;
    }

    // Find the relevant timepoint given the clicked-on study
    var timepoint = Timepoints.findOne({
        studyInstanceUids: {
            $in: [data.studyInstanceUid]
        }
    });

    if (!timepoint) {
        open(data.studyInstanceUid, title);
        return;
    }

    // Add the Timepoint name to the Patient name to create the tab title
    title += ' ' + getTimepointName(timepoint);

    openNewTabWithTimepoint(timepoint.timepointId, title);
}

/**
 * Opens a study
 *
 * @param studyInstanceUid The UID of the Study to be opened
 * @param title The title to be used for the tab heading
 */
function open(studyInstanceUid, title) {
    var contentid = 'viewerTab';

    WorklistTabs.remove({});
    
    // Create a new entry in the WorklistTabs Collection
    WorklistTabs.insert({
        title: title,
        contentid: contentid,
        studyInstanceUid: studyInstanceUid,
        active: false
    });

    ViewerData = window.ViewerData || ViewerData;

    // Update the ViewerData global object
    ViewerData[contentid] = {
        title: title,
        contentid: contentid,
        studyInstanceUids: [studyInstanceUid]
    };

    // Switch to the new tab
    console.log('open');
    switchToTab(contentid);
}
