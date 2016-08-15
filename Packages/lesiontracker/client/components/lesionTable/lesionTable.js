import { MeasurementApi } from 'meteor/lesiontracker/client/api/measurement';

Template.lesionTable.onCreated(() => {
    const instance = Template.instance();

    instance.data.lesionTableLayout = new ReactiveVar('comparison');
    instance.data.timepoints = new ReactiveVar([]);

    // Run this computation every time table layout changes
    instance.autorun(() => {
        // Get the current table layout
        const tableLayout = instance.data.lesionTableLayout.get();

        let timepoints;
        if (tableLayout === 'key') {
            timepoints = instance.data.timepointApi.key();
        } else {
            timepoints = instance.data.timepointApi.currentAndPrior();
        }

        // Return key timepoints
        instance.data.timepoints.set(timepoints);
    });
});

Template.lesionTable.onRendered(() => {
    const instance = Template.instance();

    instance.autorun(() => {
        // Run this computation every time the lesion table layout is changed
        instance.data.lesionTableLayout.dep.depend();

        if (instance.data.state.get('rightSidebar') !== 'lesions') {
            // Remove the amount attribute from sidebar element tag
            instance.$('#lesionTableContainer').closest('.sidebarMenu').removeAttr('data-timepoints');
            return;
        }

        // Get the amount of timepoints being shown
        const timepointAmount = instance.data.timepoints.get().length;

        // Set the amount in an attribute on sidebar element tag
        instance.$('#lesionTableContainer').closest('.sidebarMenu').attr('data-timepoints', timepointAmount);
    });
});

// Temporary until we have a real window manager with events for series/study changed
Session.setDefault('NewSeriesLoaded', false);

Template.lesionTable.onRendered(() => {
    // Find the first measurement by Lesion Number
    const firstLesion = MeasurementApi.firstLesion();

    // Create an object to store the ContentId inside
    const templateData = {
        contentId: Session.get('activeContentId')
    };

    // Activate the first lesion
    if (firstLesion) {
        activateLesion(firstLesion._id, templateData);
    }
});

Template.lesionTable.events({
    /**
     * Retrieve the lesion id from the DOM data for this row
     */
    /*'click table#tblLesion tbody tr': function(e, template) {
          var measurementId = $(e.currentTarget).data('measurementid');
          activateLesion(measurementId, template.data);
    },*/
});

Template.lesionTable.helpers({
    buttonGroupData() {
        const instance = Template.instance();
        return {
            value: instance.data.lesionTableLayout,
            options: [{
                value: 'comparison',
                text: 'Comparison'
            }, {
                value: 'key',
                text: 'Key Timepoints'
            }]
        };
    }
});
