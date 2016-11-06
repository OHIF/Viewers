import { OHIF } from 'meteor/ohif:core';

Template.measurementTableTimepointCell.helpers({
    hasDataAtThisTimepoint() {
        // This simple function just checks whether or not timepoint data
        // exists for this Measurement at this Timepoint
        const instance = Template.instance();
        const rowItem = instance.data.rowItem;

        if (this.timepointId) {
            const dataAtThisTimepoint = _.where(rowItem.entries, {timepointId: this.timepointId});
            return dataAtThisTimepoint.length > 0;
        } else {
            return rowItem.entries.length > 0;
        }
    },
    displayData() {
        const instance = Template.instance();

        const rowItem = instance.data.rowItem;
        let data;
        if (this.timepointId) {
            const dataAtThisTimepoint = _.where(rowItem.entries, {timepointId: this.timepointId});
            if (dataAtThisTimepoint.length > 1) {
                throw 'More than one measurement was found at the same timepoint with the same measurement number?';
            }
            data = dataAtThisTimepoint[0];
        } else {
            data = rowItem.entries[0];
        }

        const config = OHIF.measurements.MeasurementApi.getConfiguration();
        const measurementTools = config.measurementTools;

        const tool = _.where(measurementTools, {id: rowItem.measurementTypeId})[0];
        if (!tool) {
            // TODO: Figure out what is going on here?
            console.warn('Something went wrong?');
        }
        const displayFunction = tool.options.measurementTableOptions.displayFunction;
        return displayFunction(data);
    }
});

function doneCallback(measurementData, deleteTool) {
    // If a Lesion or Non-Target is removed via a dialog
    // opened by the Lesion Table, we should clear the data for
    // the specified Timepoint Cell
    if (deleteTool === true) {
        OHIF.log.info('Confirm clicked!');
        OHIF.lesiontracker.clearMeasurementTimepointData(measurementData.id, measurementData.timepointId);
    }
}

// Delete a lesion if Ctrl+D or DELETE is pressed while a lesion is selected
const keys = {
    D: 68,
    DELETE: 46
};

Template.measurementTableTimepointCell.events({
    'dblclick .measurementTableTimepointCell': function() {
        OHIF.log.info('Double clicked on a timepoint cell');
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
                OHIF.lesiontracker.clearMeasurementTimepointData(currentMeasurement._id, currentTimepointID);
            });
        } else {
            changeNonTargetResponse(measurementData, null, doneCallback);
        }
    },
    'keydown .measurementTableTimepointCell': function(e) {
        const keyCode = e.which;
        if (keyCode === keys.DELETE ||
            (keyCode === keys.D && e.ctrlKey === true)) {
            const currentMeasurement = Template.parentData(1).rowItem;
            const currentTimepointID = this.timepointId;

            showConfirmDialog(function() {
                OHIF.lesiontracker.clearMeasurementTimepointData(currentMeasurement._id, currentTimepointID);
            });
        }
    }
});
