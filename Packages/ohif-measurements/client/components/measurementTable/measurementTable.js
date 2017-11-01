import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.measurementTable.onCreated(() => {
    const instance = Template.instance();

    instance.data.measurementTableLayout = new ReactiveVar('comparison');
    instance.data.timepoints = new ReactiveVar([]);

    // Run this computation every time table layout changes
    instance.autorun(() => {
        // Get the current table layout
        const tableLayout = instance.data.measurementTableLayout.get();

        const timepointApi = instance.data.timepointApi;
        let timepoints;
        if (!timepointApi) {
            timepoints = [];
        } else if (tableLayout === 'key') {
            timepoints = timepointApi.key();
        } else {
            timepoints = timepointApi.comparison();
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
    hasWarnings() {
        return Template.instance().data.conformanceCriteria.nonconformities.get();
    },

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

Template.measurementTable.events({
    'click .warning-status'(event, instance) {
        const nonconformities = instance.data.conformanceCriteria.nonconformities.get();
        const messages = [];
        _.each(nonconformities, nonconformity => messages.push(nonconformity.message));

        OHIF.ui.showDialog('measurementTableWarningsDialog', {
            messages,
            position: {
                x: event.clientX,
                y: event.clientY
            }
        });
    }
});
