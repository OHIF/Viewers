/**
 * Opens a new tab in the tabbed worklist environment using
 * a given timepoint and new tab title.
 *
 * @param timepointId The UID of the Timepoint to be opened
 * @param title The title to be used for the tab heading
 */
openNewTabWithTimepoint = function(timepointId, title) {
    console.log('openNewTabWithTimepoint');
    var contentId = 'viewerTab';

    var timepoint = Timepoints.findOne({
        timepointId: timepointId
    });
    
    if (!timepoint) {
        throw 'No such timepoint exists';
    }

    // Get the relevant studyInstanceUids given the timepoints
    var data = getDataFromTimepoint(timepoint);
    if (!data.studyInstanceUids) {
        throw 'No studies found that are related to this timepoint';
    }

    ViewerData = window.ViewerData || ViewerData;

    // Update the ViewerData global object
    ViewerData[contentId] = {
        title: title,
        contentid: contentId,
        studyInstanceUids: data.studyInstanceUids,
        timepointIds: data.timepointIds,
        currentTimepointId: timepointId
    };

    // Switch to the new tab
    switchToTab(contentId);
};

/**
 * Retrieves related studies given a Baseline or Follow-up Timepoint
 *
 * @param timepoint
 * @returns {Array}
 */
function getDataFromTimepoint(timepoint) {
    var relatedStudies = [];

    // Include the specified studyInstanceUids
    // NOTE: Temporarily added [0], since we only need one study per timepoint to load immediately?
    relatedStudies = relatedStudies.concat(timepoint.studyInstanceUids[0]);

    // If this is the baseline, we should stop here and return the relevant studies
    if (isBaseline(timepoint)) {
        return {
            studyInstanceUids: relatedStudies,
            timepointIds: [timepoint.timepointId]
        };
    }

    // Otherwise, this is a follow-up exam, so we should also find the baseline timepoint,
    // and all studies related to it. We also enforce that the Baseline should have a studyDate
    // prior to the latest studyDate in the current (Follow-up) Timepoint.
    var baseline = Timepoints.findOne({
        timepointType: 'baseline',
        patientId: timepoint.patientId,
        latestDate: {
            $lte: timepoint.latestDate
        }
    });

    var timepointIds = [];
    if (baseline) {
        // NOTE: Temporarily added [0], since we only need one study per timepoint to load immediately?
        relatedStudies = relatedStudies.concat(baseline.studyInstanceUids[0]);
        timepointIds.push(baseline.timepointId);
    } else {
        log.warn('No Baseline found while opening a Follow-up Timepoint');
    }

    timepointIds.push(timepoint.timepointId);

    return {
        studyInstanceUids: relatedStudies,
        timepointIds: timepointIds
    };
}

/**
 * Checks if a Timepoints is a baseline or not
 * (abstracting this for later use, since I expect it to get more complex)
 *
 * @param timepoint a document from the Timepoints Collection
 * @returns {boolean} Whether or not the timepoint is stored as a Baseline
 */
function isBaseline(timepoint) {
    return (timepoint.timepointType === 'baseline');
}
