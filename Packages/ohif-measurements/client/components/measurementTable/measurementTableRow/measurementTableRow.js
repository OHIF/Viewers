import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

Template.measurementTableRow.onCreated(() => {
    const instance = Template.instance();

    instance.getWarningMessages = () => {
        const measurementTypeId = instance.data.rowItem.measurementTypeId;
        const measurementNumber = instance.data.rowItem.measurementNumber;
        const groupedNonConformities = instance.data.conformanceCriteria.groupedNonConformities.get() || {};
        const nonconformitiesByMeasurementTypeId = groupedNonConformities[measurementTypeId] || {};
        const nonconformitiesByMeasurementNumbers = nonconformitiesByMeasurementTypeId.measurementNumbers || {};
        const nonconformitiesByMeasurementNumber = nonconformitiesByMeasurementNumbers[measurementNumber] || {};

        return _.uniq(nonconformitiesByMeasurementNumber.messages || []);
    };
});

Template.measurementTableRow.helpers({
    hasWarnings() {
        return !!Template.instance().getWarningMessages().length;
    }
});

Template.measurementTableRow.events({
    'click .measurementRowSidebar .warning-icon'(event, instance) {
        event.stopPropagation();
        OHIF.ui.showDialog('measurementTableWarningsDialog', {
            messages: instance.getWarningMessages(),
            position: {
                x: event.clientX,
                y: event.clientY
            }
        });
    },

    'click .measurementRowSidebar'(event, instance) {
        const $row = instance.$('.measurementTableRow');
        const rowItem = instance.data.rowItem;
        const timepoints = instance.data.timepoints.get();

        $row.closest('.measurementTableView').find('.measurementTableRow').not($row).removeClass('active');
        $row.toggleClass('active');

        const childToolKey = $(event.target).attr('data-child');
        OHIF.measurements.jumpToRowItem(rowItem, timepoints, childToolKey);
    },

    'click .js-rename'(event, instance) {
        const rowItem = instance.data.rowItem;
        const entry = rowItem.entries[0];

        // Show the measure flow for targets
        OHIF.measurements.toggleLabelButton({
            measurement: entry,
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
