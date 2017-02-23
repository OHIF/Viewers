import { OHIF } from 'meteor/ohif:core';

/**
 * Calculates a Timepoint's name based on how many timepoints exist between it
 * and the latest Baseline. Names returned are in the form of 'Baseline', or
 * 'Follow-up 1', 'Follow-up 2', and so on.
 *
 * @param timepoint
 * @returns {*} The timepoint name
 */
OHIF.measurements.getTimepointName = timepoint => {
    // Check if this is a Baseline timepoint, if it is, return 'Baseline'
    if (timepoint.timepointType === 'baseline') {
        return 'Baseline';
    } else if (timepoint.visitNumber) {
        return 'Follow-up ' + timepoint.visitNumber;
    }

    // Retrieve all of the relevant follow-up timepoints for this patient
    const followupTimepoints = Timepoints.find({
        patientId: timepoint.patientId,
        timepointType: timepoint.timepointType
    }, {
        sort: {
            latestDate: 1
        }
    });

    // Create an array of just timepointIds, so we can use indexOf
    // on it to find the current timepoint's relative position
    const followupTimepointIds = followupTimepoints.map(timepoint => timepoint.timepointId);

    // Calculate the index of the current timepoint in the array of all
    // relevant follow-up timepoints
    const index = followupTimepointIds.indexOf(timepoint.timepointId) + 1;

    // If index is 0, it means that the current timepoint was not in the list
    // Log a warning and return here
    if (!index) {
        OHIF.log.warn('Current follow-up was not in the list of relevant follow-ups?');
        return;
    }

    // Return the timepoint name as 'Follow-up N'
    return 'Follow-up ' + index;
};
