import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.measurementTableView.onCreated(() => {
    const instance = Template.instance();
    const { measurementApi, timepointApi } = instance.data;

    instance.data.measurementGroups = new ReactiveVar();

    Tracker.autorun(() => {
        measurementApi.changeObserver.depend();
        const data = OHIF.measurements.getMeasurementsGroupedByNumber(measurementApi, timepointApi);
        instance.data.measurementGroups.set(data);
    });
});

Template.measurementTableView.events({
    'click .js-pdf'(event, instance) {
        const { measurementApi, timepointApi } = instance.data;
        OHIF.measurements.exportPdf(measurementApi, timepointApi);
    }
});

Template.measurementTableView.helpers({
    hasMeasurements(toolGroupId) {
        const instance = Template.instance();
        const groups = instance.data.measurementGroups.get();

        if (!groups) {
            return false;
        }

        const group = _.find(groups, item => item.toolGroup.id === toolGroupId);
        return group && !!group.measurementRows.length;
    },

    getNewLesionsToolGroup(newLesionGroup) {
        const configuration = OHIF.measurements.MeasurementApi.getConfiguration();
        const toolGroup = _.findWhere(configuration.measurementTools, { id: newLesionGroup.toolGroupId });

        return {
            id: newLesionGroup.id,
            name: newLesionGroup.name,
            childTools: toolGroup.childTools,
            measurementTypeId: toolGroup.id
        };
    },

    newLesionsMeasurements(toolGroup) {
        const { measurementApi, timepointApi } = Template.instance().data;
        const current = timepointApi.current();
        const baseline = timepointApi.baseline();

        if (!measurementApi || !timepointApi || !current || !baseline) return;

        // If this is a baseline, stop here since there are no new measurements to display
        if (!current || current.timepointType === 'baseline') {
            OHIF.log.info('Skipping New Measurements section');
            return;
        }

        // Retrieve all the data for this Measurement type (e.g. 'targets')
        // which was recorded at baseline.
        const measurementTypeId = toolGroup.measurementTypeId;
        const atBaseline = measurementApi.fetch(measurementTypeId, {
            timepointId: baseline.timepointId
        });

        // Obtain a list of the Measurement Numbers from the
        // measurements which have baseline data
        const numbers = atBaseline.map(m => m.measurementNumber);

        // Retrieve all the data for this Measurement type which
        // do NOT match the Measurement Numbers obtained above
        const data = measurementApi.fetch(measurementTypeId, {
            measurementNumber: { $nin: numbers }
        });

        // Group the Measurements by Measurement Number
        const groupObject = _.groupBy(data, entry => entry.measurementNumber);

        // Reformat the data for display in the table
        return Object.keys(groupObject).map(key => ({
            measurementTypeId: measurementTypeId,
            measurementNumber: key,
            location: OHIF.measurements.getLocation(groupObject[key]),
            responseStatus: false, // TODO: Get the latest timepoint and determine the response status
            entries: groupObject[key]
        }));
    }
});
