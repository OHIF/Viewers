import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';

import { OHIF } from 'meteor/ohif:core';

import { schema as TimepointSchema } from 'meteor/ohif:measurements/both/schema/timepoints';

const configuration = {};

class TimepointApi {
    static setConfiguration(config) {
        _.extend(configuration, config);
    }

    static getConfiguration() {
        return configuration;
    }

    constructor(currentTimepointId, options={}) {
        if (currentTimepointId) {
            this.currentTimepointId = currentTimepointId;
        }

        this.options = options;
        this.timepoints = new Mongo.Collection(null);
        this.timepoints.attachSchema(TimepointSchema);
        this.timepoints._debugName = 'Timepoints';
    }

    retrieveTimepoints(filter) {
        const retrievalFn = configuration.dataExchange.retrieve;
        if (!_.isFunction(retrievalFn)) {
            OHIF.log.error('Timepoint retrieval function has not been configured.');
            return;
        }

        return new Promise((resolve, reject) => {
            retrievalFn(filter).then(timepointData => {
                OHIF.log.info('Timepoint data retrieval');

                _.each(timepointData, timepoint => {
                    delete timepoint._id;
                    const query = {
                        timepointId: timepoint.timepointId
                    };

                    this.timepoints.update(query, {
                        $set: timepoint
                    }, {
                        upsert: true
                    });
                });

                resolve();
            }).catch(reason => {
                OHIF.log.error(`Timepoint retrieval function failed: ${reason}`);
                reject(reason);
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

    disassociateStudy(timepointIds, studyInstanceUid) {
        const disassociateFn = configuration.dataExchange.disassociate;
        disassociateFn(timepointIds, studyInstanceUid).then(() => {
            OHIF.log.info('Disassociation completed');

            this.timepoints.remove({});
            this.retrieveTimepoints({});
        });
    }

    removeTimepoint(timepointId) {
        const removeFn = configuration.dataExchange.remove;
        if (!_.isFunction(removeFn)) {
            return;
        }

        const timepointData = {
            timepointId
        };

        OHIF.log.info('Preparing to remove timepoint');
        OHIF.log.info(JSON.stringify(timepointData, null, 2));

        removeFn(timepointData).then(() => {
            OHIF.log.info('Timepoint removal completed');
            this.timepoints.remove(timepointData);
        });
    }

    updateTimepoint(timepointId, query) {
        const updateFn = configuration.dataExchange.update;
        if (!_.isFunction(updateFn)) {
            return;
        }

        const timepointData = {
            timepointId
        };

        OHIF.log.info('Preparing to update timepoint');
        OHIF.log.info(JSON.stringify(timepointData, null, 2));
        OHIF.log.info(JSON.stringify(query, null, 2));

        updateFn(timepointData, query).then(() => {
            OHIF.log.info('Timepoint updated completed');
            this.timepoints.update(timepointData, query);
        });
    }

    // Return all timepoints
    all(filter={}) {
        return this.timepoints.find(filter, {
            sort: {
                latestDate: -1
            },
        }).fetch();
    }

    // Return only the current timepoint
    current() {
        return this.timepoints.findOne({ timepointId: this.currentTimepointId });
    }

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

    // Return the prior timepoint
    prior() {
        const current = this.current();
        if (!current) {
            return;
        }

        const latestDate = current.latestDate;
        return this.timepoints.findOne({
            latestDate: { $lt: latestDate }
        }, {
            sort: { latestDate: -1 }
        });
    }

    // Return only the current and prior timepoints
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

    // Return only the comparison timepoints
    comparison() {
        return this.currentAndPrior();
    }

    // Return only the baseline timepoint
    baseline() {
        return this.timepoints.findOne({ timepointType: 'baseline' });
    }

    // Return only the nadir timepoint
    nadir() {
        const timepoint = this.timepoints.findOne({ timepointKey: 'nadir' });
        return timepoint || this.baseline();
    }

    // Return only the key timepoints (current, prior, nadir and baseline)
    key(filter={}) {
        const result = [];

        // Get all the timepoints
        const all = this.all(filter);

        // Iterate over each timepoint and insert the key ones in the result
        _.each(all, (timepoint, index) => {
            if (index < 2 || index === (all.length - 1)) {
                result.push(timepoint);
            }
        });

        // Return the resulting timepoints
        return result;
    }

    // Return only the timepoints for the given study
    study(studyInstanceUid) {
        const result = [];

        // Iterate over each timepoint and insert the key ones in the result
        _.each(this.all(), (timepoint, index) => {
            if (_.contains(timepoint.studyInstanceUids, studyInstanceUid)) {
                result.push(timepoint);
            }
        });

        // Return the resulting timepoints
        return result;
    }

    // Return the timepoint's name
    name(timepoint) {
        // Check if this is a Baseline timepoint, if it is, return 'Baseline'
        if (timepoint.timepointType === 'baseline') {
            return 'Baseline';
        } else if (timepoint.visitNumber) {
            return 'Follow-up ' + timepoint.visitNumber;
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

        const all = _.clone(this.all());
        let index = -1;
        let currentIndex = null;
        for (let i = 0; i < all.length; i++) {
            const currentTimepoint = all[i];

            // Skip the iterations until we can't find the selected timepoint on study list
            if (this.currentTimepointId === currentTimepoint.timepointId) {
                currentIndex = 0;
            }

            if (_.isNumber(currentIndex)) {
                index = currentIndex++;
            }

            // Break the loop if reached the timepoint to get the title
            if (currentTimepoint.timepointId === timepoint.timepointId) {
                break;
            }
        }

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
