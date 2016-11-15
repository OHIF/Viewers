import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

function doneCallback(measurementData, deleteTool) {
    // If a Lesion or Non-Target is removed via a dialog
    // opened by the Lesion Table, we should clear the data for
    // the specified Timepoint Cell
    if (deleteTool === true) {
        Meteor.call('removeMeasurement', measurementData.id, function(error, response) {
            if (error) {
                OHIF.log.warn(error);
            }
        });
    }
}

// Delete a lesion if Ctrl+D or DELETE is pressed while a lesion is selected
const keys = {
    D: 68,
    DELETE: 46
};

Template.measurementTableRow.events({
    'click .measurementRowSidebar'(event, instance) {
        const $row = instance.$('.measurementTableRow');
        $row.closest('.measurementTableView').find('.measurementTableRow').not($row).removeClass('active');
        $row.toggleClass('active');
    },

    'click .js-rename'(event, instance) {
        const rowItem = instance.data.rowItem;

        // Show the measure flow for targets
        OHIF.measurements.toggleLabelButton({
            instance,
            measurementId: rowItem.entries[0]._id,
            measurementTypeId: rowItem.measurementTypeId,
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
            title: 'Delete measurements',
            message: 'Are you sure you want to delete the measurement across all timepoints?'
        };

        OHIF.ui.showFormDialog('dialogConfirm', dialogSettings).then(formData => {
            const measurementTypeId = instance.data.rowItem.measurementTypeId;
            const measurement = instance.data.rowItem.entries[0];
            const toolType = measurement.toolType;
            const measurementNumber = measurement.measurementNumber;
            const measurementApi = instance.data.measurementApi;
            const timepointApi = instance.data.timepointApi;

            // Remove all the measurements with the given type and number
            measurementApi.deleteMeasurements(measurementTypeId, {
                toolType,
                measurementNumber
            });

            // Update the Overall Measurement Numbers for all Measurements
            const baseline = timepointApi.baseline();
            measurementApi.sortMeasurements(baseline.timepointId);

            // Repaint the images on all viewports without the removed measurements
            _.each($('.imageViewerViewport'), element => cornerstone.updateImage(element));
        });
    },

    'keydown .location'(event) {
        const keyCode = event.which;

        if (keyCode === keys.DELETE ||
            (keyCode === keys.D && event.ctrlKey === true)) {
            const currentMeasurement = this;
            const options = {
                keyPressAllowed: false,
                title: 'Remove measurement?',
                text: 'Are you sure you would like to remove the entire measurement?'
            };

            showConfirmDialog(() => {
                Meteor.call('removeMeasurement', currentMeasurement._id, (error, response) => {
                    if (error) {
                        OHIF.log.warn(error);
                    }
                });
            }, options);
        }
    }
});
