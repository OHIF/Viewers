import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

Template.measurementLightTableRow.helpers({
    displayData() {
        const instance = Template.instance();
        const { rowItem, timepointId } = instance.data;

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
            return 'No measurement value';
        }

        const { displayFunction } = tool.options.measurementTable;
        return displayFunction(data);
    }
});

Template.measurementLightTableRow.events({
    'click .measurementLightTableRow'(event, instance) {
        const $row = instance.$('.measurementLightTableRow');
        const rowItem = instance.data.rowItem;
        const timepoints = instance.data.timepoints.get();

        $row.closest('.measurementLightTableView').find('.measurementLightTableRow').not($row).removeClass('active');
        $row.toggleClass('active');

        const childToolKey = $(event.target).attr('data-child');
        OHIF.measurements.jumpToRowItem(rowItem, timepoints, childToolKey);
    },

    'click .js-rename'(event, instance) {
        event.stopPropagation();
        const rowItem = instance.data.rowItem;
        const entry = rowItem.entries[0];

        // Show the measure flow for measurements
        OHIF.measurements.toggleLabelButton({
            measurement: entry,
            oldValue: {},
            element: document.body,
            measurementApi: instance.data.measurementApi,
            position: {
                x: event.clientX,
                y: event.clientY
            },
            autoClick: true
        });
    },

    'click .js-delete'(event, instance) {
        event.stopPropagation();
        const dialogSettings = {
            class: 'themed',
            title: 'Delete measurements',
            message: 'Are you sure you want to delete the measurement across all timepoints?',
            position: {
                x: event.clientX,
                y: event.clientY
            }
        };

        OHIF.ui.showDialog('dialogConfirm', dialogSettings).then(formData => {
            const measurementTypeId = instance.data.rowItem.measurementTypeId;
            const measurement = instance.data.rowItem.entries[0];
            const measurementNumber = measurement.measurementNumber;
            const { timepointApi, measurementApi } = instance.data;

            // Remove all the measurements with the given type and number
            measurementApi.deleteMeasurements(measurementTypeId, { measurementNumber });

            // Sync the new measurement data with cornerstone tools
            const baseline = timepointApi.baseline();
            measurementApi.sortMeasurements(baseline.timepointId);

            // Repaint the images on all viewports without the removed measurements
            _.each($('.imageViewerViewport'), element => cornerstone.updateImage(element));

            // Notify that viewer suffered changes
            OHIF.measurements.triggerTimepointUnsavedChanges('deleted');
        });
    }
});
