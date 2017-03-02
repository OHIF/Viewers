import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.measurementTableTimepointCell.helpers({
    hasDataAtThisTimepoint() {
        // This simple function just checks whether or not timepoint data
        // exists for this Measurement at this Timepoint
        const instance = Template.instance();
        const rowItem = instance.data.rowItem;
        const timepointId = instance.data.timepointId;

        if (timepointId) {
            const dataAtThisTimepoint = _.where(rowItem.entries, { timepointId });
            return dataAtThisTimepoint.length > 0;
        } else {
            return rowItem.entries.length > 0;
        }
    },

    displayData() {
        const instance = Template.instance();
        const rowItem = instance.data.rowItem;
        const timepointId = instance.data.timepointId;

        let data;
        if (timepointId) {
            const dataAtThisTimepoint = _.where(rowItem.entries, { timepointId });
            if (dataAtThisTimepoint.length > 1) {
                throw 'More than one measurement was found at the same timepoint with the same measurement number?';
            }

            data = dataAtThisTimepoint[0];
        } else {
            data = rowItem.entries[0];
        }

        const config = OHIF.measurements.MeasurementApi.getConfiguration();
        const measurementTools = config.measurementTools;

        const toolGroup = _.findWhere(measurementTools, { id: rowItem.measurementTypeId });
        const tool = _.findWhere(toolGroup.childTools, { id: data.toolType });
        if (!tool) {
            // TODO: Figure out what is going on here?
            OHIF.log.warn('Something went wrong?');
        }

        const displayFunction = tool.options.measurementTable.displayFunction;
        return displayFunction(data);
    }
});

Template.measurementTableTimepointCell.events({
    'click .measurementTableTimepointCell'(event, instance) {
        if (!instance.data.timepointId) {
            return;
        }

        const rowItem = instance.data.rowItem;
        const timepoints = instance.data.timepoints.get();
        OHIF.measurements.jumpToRowItem(rowItem, timepoints);
    },

    'keydown .measurementTableTimepointCell'(event, instance) {
        // Delete a lesion if Ctrl+D or DELETE is pressed while a lesion is selected
        const keys = {
            D: 68,
            DELETE: 46
        };
        const keyCode = event.which;

        if (keyCode === keys.DELETE || keyCode === keys.BACKSPACE || (keyCode === keys.D && event.ctrlKey === true)) {
            const timepointId = instance.data.timepointId;

            const dialogSettings = {
                title: 'Delete measurements',
                message: 'Are you sure you want to delete this measurement?'
            };

            OHIF.ui.showDialog('dialogConfirm', dialogSettings).then(() => {
                const measurementTypeId = instance.data.rowItem.measurementTypeId;
                const measurement = instance.data.rowItem.entries[0];
                const measurementNumber = measurement.measurementNumber;
                const { timepointApi, measurementApi } = instance.data;

                // Remove all the measurements with the given type and number
                measurementApi.deleteMeasurements(measurementTypeId, {
                    measurementNumber,
                    timepointId
                });

                // Sync the new measurement data with cornerstone tools
                const baseline = timepointApi.baseline();
                measurementApi.sortMeasurements(baseline.timepointId);

                // Repaint the images on all viewports without the removed measurements
                _.each($('.imageViewerViewport'), element => cornerstone.updateImage(element));
            });
        }
    }
});
