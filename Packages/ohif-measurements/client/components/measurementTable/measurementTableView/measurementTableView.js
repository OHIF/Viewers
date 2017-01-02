import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

OHIF.measurements.getLocation = collection => {
    for (let i = 0; i < collection.length; i++) {
        if (collection[i].location) {
            return collection[i].location;
        }
    }
};

Template.measurementTableView.onCreated(() => {
    const instance = Template.instance();
    const measurementApi = instance.data.measurementApi;
    const configuration = OHIF.measurements.MeasurementApi.getConfiguration();

    instance.displayToolGroupMap = {};
    instance.displayToolList = [];
    configuration.measurementTools.forEach(toolGroup => {
        instance.displayToolGroupMap[toolGroup.id] = false;
        toolGroup.childTools.forEach(tool => {
            const willDisplay = !!(tool.options && tool.options.measurementTable && tool.options.measurementTable.displayFunction);
            if (willDisplay) {
                instance.displayToolList.push(tool.id);
                instance.displayToolGroupMap[toolGroup.id] = true;
            }
        });
    });
});


Template.measurementTableView.helpers({
    getNewMeasurementType(tool) {
        // TODO: Check Conformance criteria here.
        // RECIST should be nonTargets, irRC should be targets
        return {
            id: tool.id,
            name: tool.name,
            cornerstoneToolType: 'nonTarget',
            measurementTypeId: 'nonTargets'
        };
    },

    shallDisplayGroup(toolGroupId) {
        const instance = Template.instance();
        return instance.displayToolGroupMap[toolGroupId];
    },

    groupByMeasurementNumber(measurementTypeId) {
        const instance = Template.instance();
        const measurementApi = instance.data.measurementApi;
        const timepointApi = instance.data.timepointApi;
        const baseline = timepointApi.baseline();
        if (!measurementApi || !timepointApi || !baseline) {
            return;
        }

        // Retrieve all the data for this Measurement type (e.g. 'targets')
        // which was recorded at baseline.
        const atBaseline = measurementApi.fetch(measurementTypeId, {
            timepointId: baseline.timepointId
        });

        // Obtain a list of the Measurement Numbers from the
        // measurements which have baseline data
        const numbers = atBaseline.map(m => m.measurementNumber);

        // Retrieve all the data for this Measurement type which
        // match the Measurement Numbers obtained above
        const data = measurementApi.fetch(measurementTypeId, {
            toolId: {
                $in: instance.displayToolList
            },
            measurementNumber: {
                $in: numbers
            }
        });

        // Group the Measurements by Measurement Number
        const groupObject = _.groupBy(data, entry => entry.measurementNumber);

        // Reformat the data for display in the table
        return Object.keys(groupObject).map(key => {
            const anEntry = groupObject[key][0];

            return {
                measurementTypeId: measurementTypeId,
                measurementNumber: key,
                measurementNumberOverall: anEntry.measurementNumberOverall,
                location: OHIF.measurements.getLocation(groupObject[key]),
                responseStatus: false, // TODO: Get the latest timepoint and determine the response status
                entries: groupObject[key]
            };
        });
    },

    newMeasurements(measurementType) {
        const instance = Template.instance();
        const measurementApi = instance.data.measurementApi;
        const timepointApi = instance.data.timepointApi;
        const current = instance.data.timepointApi.current();
        const baseline = timepointApi.baseline();

        if (!measurementApi || !timepointApi || !current) {
            return;
        }

        // If this is a baseline, stop here since there are no new measurements to display

        if (!current || current.timepointType === 'baseline') {
            OHIF.log.info('Skipping New Measurements section');
            return;
        }

        // Retrieve all the data for this Measurement type (e.g. 'targets')
        // which was recorded at baseline.
        const measurementTypeId = measurementType.measurementTypeId;
        const atBaseline = measurementApi.fetch(measurementTypeId, {
            timepointId: baseline.timepointId
        });

        // Obtain a list of the Measurement Numbers from the
        // measurements which have baseline data
        const numbers = atBaseline.map(m => m.measurementNumber);

        // Retrieve all the data for this Measurement type which
        // do NOT match the Measurement Numbers obtained above
        const data = measurementApi.fetch(measurementTypeId, {
            measurementNumber: {
                $nin: numbers
            }
        });

        // Group the Measurements by Measurement Number
        const groupObject = _.groupBy(data, entry => entry.measurementNumber);

        // Reformat the data for display in the table
        return Object.keys(groupObject).map(key => {
            const anEntry = groupObject[key][0];

            return {
                measurementTypeId: measurementTypeId,
                measurementNumber: key,
                measurementNumberOverall: anEntry.measurementNumberOverall,
                location: OHIF.measurements.getLocation(groupObject[key]),
                responseStatus: false, // TODO: Get the latest timepoint and determine the response status
                entries: groupObject[key]
            };
        });
    }
});
