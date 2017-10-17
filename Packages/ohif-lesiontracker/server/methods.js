import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { OHIF } from 'meteor/ohif:core';
import { measurementTools } from 'meteor/ohif:lesiontracker/both/configuration/measurementTools';

let MeasurementCollections = {};
measurementTools.forEach(tool => {
    MeasurementCollections[tool.id] = new Mongo.Collection(tool.id);
    MeasurementCollections[tool.id]._debugName = tool.id;
});

const Timepoints = new Mongo.Collection('timepoints');
Timepoints._debugName = 'Timepoints';

Meteor.publish('timepoints', function() {
    return Timepoints.find();
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

    disassociateStudy(timepointIds, studyInstanceUid) {
        OHIF.log.info('Disassociating Study from Timepoints');
        timepointIds.forEach(timepointId => {
            const timepoint = Timepoints.findOne({ timepointId });
            if (!timepoint) {
                return;
            }

            // Find the index of the current studyInstanceUid in the array
            // of reference studyInstanceUids
            const index = timepoint.studyInstanceUids.indexOf(studyInstanceUid);
            if (index < 0) {
                return;
            }

            // Remove the specified studyInstanceUid from the array of associated studyInstanceUids
            timepoint.studyInstanceUids.splice(index, 1);

            if (timepoint.studyInstanceUids.length) {
                Timepoints.update(timepoint._id, {
                    $set: {
                        studyInstanceUids: timepoint.studyInstanceUids
                    }
                });
            } else {
                Timepoints.remove(timepoint._id);
            }

            // Remove all Measurement Data for this timepoint and study
            measurementTools.forEach(tool => {
                const filter = {
                    studyInstanceUid: studyInstanceUid,
                    timepointId: timepointId
                };

                MeasurementCollections[tool.id].remove(filter);
            });
        });
    },

    removeTimepoint(timepointId) {
        OHIF.log.info('Removing Timepoint from the Server');
        Timepoints.remove({ timepointId });
    },

    updateTimepoint(timepointData, query) {
        OHIF.log.info('Updating Timepoint on the Server');
        OHIF.log.info(JSON.stringify(timepointData, null, 2));
        OHIF.log.info(JSON.stringify(query, null, 2));
        Timepoints.update(timepointData, query);
    },

    retrieveTimepoints(filter={}) {
        OHIF.log.info('Retrieving Timepoints from the Server');
        return Timepoints.find(filter).fetch();
    },

    storeMeasurements(measurementData, filter = {}) {
        OHIF.log.info('Storing Measurements on the Server');
        OHIF.log.info(JSON.stringify(measurementData, null, 2));

        Object.keys(measurementData).forEach(toolId => {
            if (!MeasurementCollections[toolId]) {
                return;
            }

            MeasurementCollections[toolId].remove(filter);

            const measurements = measurementData[toolId];
            measurements.forEach(measurement => {
                MeasurementCollections[toolId].insert(measurement);
            });
        });
    },

    retrieveMeasurements(patientId, timepointIds) {
        OHIF.log.info('Retrieving Measurements from the Server');
        let measurementData = {};

        const filter = {};
        if (patientId) {
            filter.patientId = patientId;
        }

        if (timepointIds) {
            filter.timepointId = {
                $in: timepointIds
            };
        }

        measurementTools.forEach(tool => {
            measurementData[tool.id] = MeasurementCollections[tool.id].find(filter).fetch();
        });

        return measurementData;
    }
});
