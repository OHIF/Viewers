import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.measurementLightTableView.onCreated(() => {
    const instance = Template.instance();
    const { measurementApi, timepointApi } = instance.data;

    instance.data.measurementGroups = new ReactiveVar();

    Tracker.autorun(() => {
        measurementApi.changeObserver.depend();
        const data = OHIF.measurements.getMeasurementsGroupedByNumber(measurementApi, timepointApi);
        instance.data.measurementGroups.set(data);
    });
});

Template.measurementLightTableView.events({
    'click .js-csv'(event, instance) {
        const { measurementApi, timepointApi } = instance.data;
        OHIF.measurements.exportCSV(measurementApi, timepointApi);
    },
});

Template.measurementLightTableView.helpers({
    hasAnyMeasurement() {
        const instance = Template.instance();
        const groups = instance.data.measurementGroups.get();

        if (!groups) {
            return false;
        }

        const group = _.find(groups, item => item.measurementRows.length > 0);
        return group;
    }
});
