import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { OHIF } from 'meteor/ohif:core';
import { measurementTools } from 'meteor/ohif:lesiontracker/both/configuration/measurementTools';

let MeasurementCollections = {};
measurementTools.forEach(tool => {
    MeasurementCollections[tool.id] = new Mongo.Collection(tool.id);
});

Timepoints = new Mongo.Collection('timepoints');

// Drop our collections for testing purposes
Meteor.startup(() => {
    Timepoints.remove({});
    measurementTools.forEach(tool => {
        MeasurementCollections[tool.id].remove({});
    });
});

// TODO: Make storage use update instead of clearing the entire collection and
// re-inserting everything.
Meteor.methods({
    storeTimepoints(timepoints) {
        OHIF.log.info('Storing Timepoints on the Server');
        OHIF.log.info(JSON.stringify(timepoints, null, 2));
        Timepoints.remove({});
        timepoints.forEach(timepoint => {
            delete timepoint._id;
            Timepoints.insert(timepoint);
        });
    },

    retrieveTimepoints() {
        OHIF.log.info('Retrieving Timepoints from the Server');
        return Timepoints.find().fetch();
    },

    storeMeasurements(measurementData) {
        OHIF.log.info('Storing Measurements on the Server');
        OHIF.log.info(JSON.stringify(measurementData, null, 2));

        Object.keys(measurementData).forEach(toolId => {
            if (!MeasurementCollections[toolId]) {
                return;
            }

            MeasurementCollections[toolId].remove({});

            const measurements = measurementData[toolId];
            measurements.forEach(measurement => {
                MeasurementCollections[toolId].insert(measurement);
            });
        });
    },

    retrieveMeasurements() {
        OHIF.log.info('Retrieving Measurements from the Server');
        let measurementData = {};

        measurementTools.forEach(tool => {
            measurementData[tool.id] = MeasurementCollections[tool.id].find().fetch();
        });

        return measurementData;
    }
});
