Template.lesionTableTimepointCell.helpers({
    hasDataAtThisTimepoint() {
        // This simple function just checks whether or not timepoint data
        // exists for this Measurement at this Timepoint
        const lesionData = Template.parentData(1).rowItem;
        return (lesionData &&
            lesionData.timepoints &&
            lesionData.timepoints[this.timepointId]);
    },
    displayData() {
        // Search Measurements by lesion and timepoint
        const lesionData = Template.parentData(1).rowItem;
        if (!lesionData ||
            !lesionData.timepoints ||
            !lesionData.timepoints[this.timepointId]) {
            return;
        }

        const data = lesionData.timepoints[this.timepointId];

        // Check whether this is a Nodal or Extranodal Measurement
        const targetType = lesionData.isTarget ? 'target' : 'nonTarget';
        const nodalType = lesionData.isNodal ? 'nodal' : 'extraNodal';

        // Get criteria types
        const criteriaTypes = TrialCriteriaTypes.find({
            selected: true
        }).map(criteria => {
            return criteria.id;
        });

        const currentConstraints = getTrialCriteriaConstraints(criteriaTypes, data.imageId);

        if (lesionData.toolType === 'bidirectional') {
            if (data.shortestDiameter) {
                if (currentConstraints) {
                    const criteria = currentConstraints[targetType][nodalType];
                    if (criteria && Object.keys(criteria)[0] === 'shortestDiameter') {
                        return data.shortestDiameter + ' x ' + data.longestDiameter;
                    }
                }

                return data.longestDiameter + ' x ' + data.shortestDiameter;
            }

            return data.longestDiameter;
        } else {
            return data.response;
        }
    },

    isBidirectional() {
        const lesionData = Template.parentData(1).rowItem;
        return lesionData.toolType === 'bidirectional';
    }
});

function doneCallback(measurementData, deleteTool) {
    // If a Lesion or Non-Target is removed via a dialog
    // opened by the Lesion Table, we should clear the data for
    // the specified Timepoint Cell
    if (deleteTool === true) {
        log.info('Confirm clicked!');
        clearMeasurementTimepointData(measurementData.id, measurementData.timepointId);
    }
}

// Delete a lesion if Ctrl+D or DELETE is pressed while a lesion is selected
const keys = {
    D: 68,
    DELETE: 46
};

Template.lesionTableTimepointCell.events({
    'dblclick .lesionTableTimepointCell': function() {
        log.info('Double clicked on a timepoint cell');
        // Search Measurements by lesion and timepoint
        const currentMeasurement = Template.parentData(1).rowItem;

        // Create some fake measurement data
        const currentTimepointID = this.timepointId;

        const timepointData = currentMeasurement.timepoints[currentTimepointID];
        if (!timepointData) {
            return;
        }

        let measurementData = {
            id: currentMeasurement._id,
            timepointId: currentTimepointID,
            response: timepointData.response,
            imageId: timepointData.imageId,
            handles: timepointData.handles,
            seriesInstanceUid: timepointData.seriesInstanceUid,
            studyInstanceUid: timepointData.studyInstanceUid
        };

        if (currentMeasurement.isTarget) {
            showConfirmDialog(function() {
                clearMeasurementTimepointData(currentMeasurement._id, currentTimepointID);
            });
        } else {
            changeNonTargetResponse(measurementData, null, doneCallback);
        }
    },
    'keydown .lesionTableTimepointCell': function(e) {
        const keyCode = e.which;
        if (keyCode === keys.DELETE ||
            (keyCode === keys.D && e.ctrlKey === true)) {
            const currentMeasurement = Template.parentData(1).rowItem;
            const currentTimepointID = this.timepointId;

            showConfirmDialog(function() {
                clearMeasurementTimepointData(currentMeasurement._id, currentTimepointID);
            });
        }
    }
});
