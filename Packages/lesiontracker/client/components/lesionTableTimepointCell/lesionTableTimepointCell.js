Template.lesionTableTimepointCell.helpers({
    hasDataAtThisTimepoint: function() {
        // This simple function just checks whether or not timepoint data
        // exists for this Measurement at this Timepoint
        var lesionData = Template.parentData(1).rowItem;
        return (lesionData &&
            lesionData.timepoints &&
            lesionData.timepoints[this.timepointId]);
    },
    displayData: function() {
        // Search Measurements by lesion and timepoint
        var lesionData = Template.parentData(1).rowItem;
        if (!lesionData ||
            !lesionData.timepoints ||
            !lesionData.timepoints[this.timepointId]) {
            return;
        }

        var data = lesionData.timepoints[this.timepointId];

        // Check whether this is a Nodal or Extranodal Measurement
        var targetType = lesionData.isTarget ? 'target' : 'nonTarget';
        var nodalType = lesionData.isNodal ? 'nodal' : 'extraNodal';

        // Get criteria types
        var criteriaTypes = TrialCriteriaTypes.find({
            selected: true
        }).map(function(criteria) {
            return criteria.id;
        });
        var currentConstraints = getTrialCriteriaConstraints(criteriaTypes, data.imageId);

        if (lesionData.toolType === 'bidirectional') {
            if (data.shortestDiameter) {
                if (currentConstraints) {
                    var criteria = currentConstraints[targetType][nodalType];
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

    isBidirectional: function() {
        var lesionData = Template.parentData(1).rowItem;
        if (lesionData.toolType === 'bidirectional') {
            return true;
        }
        return false
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
var keys = {
    D: 68,
    DELETE: 46
};

Template.lesionTableTimepointCell.events({
    'dblclick .lesionTableTimepointCell': function() {
        log.info('Double clicked on a timepoint cell');
        // Search Measurements by lesion and timepoint
        var currentMeasurement = Template.parentData(1).rowItem;

        // Create some fake measurement data
        var currentTimepointID = this.timepointId;

        var timepointData = currentMeasurement.timepoints[currentTimepointID];

        if (!timepointData) {
            return;
        }

        var measurementData = {
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
        var keyCode = e.which;
        if (keyCode === keys.DELETE ||
            (keyCode === keys.D && e.ctrlKey === true)) {
            var currentMeasurement = Template.parentData(1).rowItem;
            var currentTimepointID = this.timepointId;

            showConfirmDialog(function() {
                clearMeasurementTimepointData(currentMeasurement._id, currentTimepointID);
            });
        }
    }
});
