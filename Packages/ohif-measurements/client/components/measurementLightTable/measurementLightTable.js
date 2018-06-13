import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.measurementLightTable.onCreated(() => {
    const instance = Template.instance();

    instance.data.timepoints = new ReactiveVar([]);

    // Run this computation every time table layout changes
    instance.autorun(() => {
        const timepointApi = instance.data.timepointApi;
        let timepoints = timepointApi.comparison();

        // Return key timepoints
        instance.data.timepoints.set(timepoints);
    });
});
