import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.measurementTable.onCreated(() => {
    const instance = Template.instance();

    instance.data.measurementTableLayout = new ReactiveVar('comparison');
    instance.data.timepoints = new ReactiveVar([]);

    // Run this computation every time table layout changes
    instance.autorun(() => {
        // Get the current table layout
        const tableLayout = instance.data.measurementTableLayout.get();

        let timepoints;
        if (!instance.data.timepointApi) {
            timepoints = [];
        } else if (tableLayout === 'key') {
            timepoints = instance.data.timepointApi.key();
        } else  {
            timepoints = instance.data.timepointApi.currentAndPrior();
        }

        // Return key timepoints
        instance.data.timepoints.set(timepoints);
    });
});

Template.measurementTable.onRendered(() => {
    const instance = Template.instance();

    instance.autorun(() => {
        // Run this computation every time the lesion table layout is changed
        instance.data.measurementTableLayout.dep.depend();

        if (instance.data.state.get('rightSidebar') !== 'measurements') {
            // Remove the amount attribute from sidebar element tag
            instance.$('#measurementTableContainer').closest('.sidebarMenu').removeAttr('data-timepoints');
            return;
        }

        // Get the amount of timepoints being shown
        const timepointAmount = instance.data.timepoints.get().length;

        // Set the amount in an attribute on sidebar element tag
        instance.$('#measurementTableContainer').closest('.sidebarMenu').attr('data-timepoints', timepointAmount);
    });
});

Template.measurementTable.helpers({
    buttonGroupData() {
        const instance = Template.instance();
        return {
            value: instance.data.measurementTableLayout,
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
