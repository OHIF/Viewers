import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

const getPosition = event => {
    return {
        x: event.clientX,
        y: event.clientY
    };
};

Template.measurementLightTableRow.helpers({
    displayData() {
        const instance = Template.instance();
        const { rowItem } = instance.data;

        const data = rowItem.entries[0];

        const config = OHIF.measurements.MeasurementApi.getConfiguration();
        const measurementTools = config.measurementTools;

        const toolGroup = measurementTools.find( toolGroup => toolGroup.id === rowItem.measurementTypeId);
        const tool = toolGroup.childTools.find( childTool => childTool.id === data.toolType );
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
        const timepoints = instance.data.timepointApi.all();

        $row.closest('.measurementLightTableView').find('.measurementLightTableRow').not($row).removeClass('active');
        $row.toggleClass('active');

        const childToolKey = $(event.target).attr('data-child');
        OHIF.measurements.jumpToRowItem(rowItem, timepoints, childToolKey);
    },

    'click .js-edit-label'(event, instance) {
        event.stopPropagation();
        const rowItem = instance.data.rowItem;
        const entry = rowItem.entries[0];

        // Show the measure flow for measurements
        OHIF.measurements.openLocationModal({
            measurement: entry,
            element: document.body,
            measurementApi: instance.data.measurementApi,
            position: getPosition(event),
            autoClick: true
        });
    },

    'click .js-edit-description'(event, instance) {
        const rowItem = instance.data.rowItem;
        const entry = rowItem.entries[0];
        OHIF.ui.showDialog('measurementEditDescription', {
            event,
            title: 'Edit Description',
            element: event.element,
            measurementData: entry
        });
    },

    'click .js-delete'(event, instance) {
        event.stopPropagation();
        const dialogSettings = {
            class: 'themed',
            title: 'Delete measurements',
            message: 'Are you sure you want to delete the measurement?',
            position: getPosition(event)
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
