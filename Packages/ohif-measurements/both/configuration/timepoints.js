import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';

import { OHIF } from 'meteor/ohif:core';

import { schema as TimepointSchema } from 'meteor/ohif:measurements/both/schema/timepoints';

let configuration = {};

class TimepointApi {
    static setConfiguration(config) {
        _.extend(configuration, config);
    }

    static getConfiguration() {
        return configuration;
    }

    constructor(currentTimepointId, configuration) {
        if (currentTimepointId) {
            this.currentTimepointId = currentTimepointId;
        }
    }

    retrieveTimepoints(filter) {
        this.timepoints = new Mongo.Collection(null);
        this.timepoints.attachSchema(TimepointSchema);
        this.timepoints._debugName = 'Timepoints';

        const retrievalFn = configuration.dataExchange.retrieve;
        if (!_.isFunction(retrievalFn)) {
            return;
        }

        return new Promise((resolve, reject) => {
            retrievalFn(filter).then(timepointData => {
                OHIF.log.info('Timepoint data retrieval');
                OHIF.log.info(timepointData);
                _.each(timepointData, timepoint => {
                    delete timepoint._id;
                    this.timepoints.insert(timepoint);
                });

                resolve();
            });
        });
    }

    storeTimepoints() {
        const storeFn = configuration.dataExchange.store;
        if (!_.isFunction(storeFn)) {
            return;
        }

        const timepointData = this.timepoints.find().fetch();
        OHIF.log.info('Preparing to store timepoints');
        OHIF.log.info(JSON.stringify(timepointData, null, 2));

        storeFn(timepointData).then(() => OHIF.log.info('Timepoint storage completed'));
    }

    // Return all timepoints
    all() {
        return this.timepoints.find().fetch();
    }

    // Return only the current timepoint
    current() {
        return this.timepoints.findOne({
            timepointId: this.currentTimepointId
        });
    }

    // Return the prior timepoint
    lock() {
        const current = this.current();
        if (!current) {
            return;
        }

        this.timepoints.update(current._id, {
            $set: {
                locked: true
            }
        });
    }

    prior() {
        const current = this.current();
        if (!current) {
            return;
        }

        const latestDate = current.latestDate;
        return this.timepoints.findOne({
            latestDate: {
                $lt: latestDate
            }
        }, {
            sort: {
                latestDate: -1
            },
        });
    }

    // Return only the current and prior Timepoints
    currentAndPrior() {
        const timepoints = [];

        const current = this.current();
        if (current) {
            timepoints.push(current);
        }

        const prior = this.prior();
        if (current && prior && prior._id !== current._id) {
            timepoints.push(prior);
        }

        return timepoints;
    }

    // Return only the baseline timepoint
    baseline() {
        return this.timepoints.findOne({
            timepointType: 'baseline'
        });
    }

    // Return only the key timepoints (current, prior, nadir and baseline)
    key() {
        // Create a new Mini Mongo Collection to store the result
        const result = new Mongo.Collection(null);

        // Get all the timepoints
        const all = this.all();

        // Iterate over each timepoint and insert the key ones in the result
        _.each(all, (timepoint, index) => {
            if (index < 2 || index === (all.length - 1)) {
                result.insert(timepoint);
            }
        });

        // Return the resulting timepoints
        return result.find().fetch();
    }

    // Return only the timepoints for the given study
    study(studyInstanceUid) {
        // Create a new Mini Mongo Collection to store the result
        const result = new Mongo.Collection(null);

        // Iterate over each timepoint and insert the key ones in the result
        _.each(this.all(), (timepoint, index) => {
            if (_.contains(timepoint.studyInstanceUids, studyInstanceUid)) {
                result.insert(timepoint);
            }
        });

        // Return the resulting timepoints
        return result.find().fetch();
    }

    // Return the timepoint's name
    name(timepoint) {
        // Check if this is a Baseline timepoint, if it is, return 'Baseline'
        if (timepoint.timepointType === 'baseline') {
            return 'Baseline';
        }

        // Retrieve all of the relevant follow-up timepoints for this patient
        const followupTimepoints = this.timepoints.find({
            patientId: timepoint.patientId,
            timepointType: timepoint.timepointType
        }, {
            sort: {
                latestDate: 1
            }
        });

        // Create an array of just timepointIds, so we can use indexOf
        // on it to find the current timepoint's relative position
        const followupTimepointIds = followupTimepoints.map(timepoint => timepoint.timepointId);

        // Calculate the index of the current timepoint in the array of all
        // relevant follow-up timepoints
        const index = followupTimepointIds.indexOf(timepoint.timepointId) + 1;

        // If index is 0, it means that the current timepoint was not in the list
        // Log a warning and return here
        if (!index) {
            OHIF.log.warn('Current follow-up was not in the list of relevant follow-ups?');
            return;
        }

        // Return the timepoint name as 'Follow-up N'
        return 'Follow-up ' + index;
    }

    // Build the timepoint title based on its date
    title(timepoint) {
        const timepointName = this.name(timepoint);

        const all = this.all();
        let index = -1;
        _.each(all, (currentTimepoint, currentIndex) => {
            if (currentTimepoint.timepointId === timepoint.timepointId) {
                index = currentIndex;
            }
        });

        const states = {
            0: '(Current)',
            1: '(Prior)'
        };
        // TODO: [design] find out how to define the nadir timepoint
        const parenthesis = states[index] || '';
        return `${timepointName} ${parenthesis}`;
    }

}

OHIF.measurements.TimepointApi = TimepointApi;
