Template.lesionTableTimepointCell.helpers({
    'hasDataAtThisTimepoint': function() {
        // This simple function just checks whether or not timepoint data
        // exists for this Measurement at this Timepoint
        var lesionData = Template.parentData(1);
        return (lesionData &&
            lesionData.timepoints &&
            lesionData.timepoints[this.timepointID]);
    },
    'displayData': function() {
        // Search Measurements by lesion and timepoint
        var lesionData = Template.parentData(1);
        if (!lesionData ||
            !lesionData.timepoints ||
            !lesionData.timepoints[this.timepointID]) {
            return;
        }

        var data = lesionData.timepoints[this.timepointID];

        if (lesionData.isTarget === true) {
            // TODO = Add short axis data here
            //return 'LD: ' + data.longestDiameter;
            return data.longestDiameter;
        } else {
            return data.response;
        }
    },
    'isTarget': function() {
        var lesionData = Template.parentData(1);
        return lesionData.isTarget;
    }
});

function doneCallback(measurementData, deleteTool) {
    // If a Lesion or Non-Target is removed via a dialog
    // opened by the Lesion Table, we should clear the data for
    // the specified Timepoint Cell
    if (deleteTool === true) {
        log.info('Confirm clicked!');
        clearMeasurementTimepointData(measurementData.id, measurementData.timepointID);
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
        var currentMeasurement = Template.parentData(1);

        // Create some fake measurement data
        var currentTimepointID = this.timepointID;

        var timepointData = currentMeasurement.timepoints[currentTimepointID];
        var measurementData = {
            id: currentMeasurement._id,
            timepointID: currentTimepointID,
            response: timepointData.response,
            imageId: timepointData.imageId,
            handles: timepointData.handles,
            seriesInstanceUid: timepointData.seriesInstanceUid,
            studyInstanceUid: timepointData.studyInstanceUid
        };

        if (currentMeasurement.isTarget) {
            showConfirmDialog(function() {
                log.info('Confirm clicked!');
                clearMeasurementTimepointData(currentMeasurement._id, currentTimepointID);
            });
        } else {
            changeNonTargetResponse(measurementData, null, doneCallback);
        }
    },
    'keypress .lesionTableTimepointCell': function(e) {
        var keyCode = e.keyCode;
        if (keyCode === keys.DELETE ||
            (keyCode === keys.D && e.ctrlKey === true)) {
            var currentMeasurement = Template.parentData(1);
            log.info('Removing Lesion: ' + currentMeasurement._id);
            // TODO = Add confirm dialog first!
            clearMeasurementTimepointData(currentMeasurement._id, this.timepointID);
        }
    }
});