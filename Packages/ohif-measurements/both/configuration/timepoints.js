import { schema as TimepointSchema } from 'meteor/ohif:measurements/both/schema/timepoints';

let Configuration = {};

function setConfiguration(config) {
    Configuration = config;
}

function getConfiguration() {
    return Configuration;
}


function getTimepointsApi() {
    console.log('OHIF-Measurements: Defining TimepointsApi');
    const config = Configuration;

    class TimepointApi {
        constructor(currentTimepointId) {
            if (currentTimepointId) {
                this.currentTimepointId = currentTimepointId;    
            }
        }

        retrieveTimepoints() {
            this.timepoints = new Mongo.Collection(null);
            this.timepoints.attachSchema(TimepointSchema);
            this.timepoints._debugName = 'Timepoints';

            const retrievalFn = config.dataExchange.retrieve;
            if (!_.isFunction(retrievalFn)) {
                return;
            }

            return new Promise((resolve, reject) => {
                retrievalFn().then(timepointData => {
                    console.log('Timepoint data retrieval');
                    console.log(timepointData);
                    timepointData.forEach(timepoint => {
                        delete timepoint._id;
                        this.timepoints.insert(timepoint);
                    });

                    resolve();
                });
            });
        }

        storeTimepoints() {
            const storeFn = config.dataExchange.store;
            if (!_.isFunction(storeFn)) {
                return;
            }

            const timepointData = this.timepoints.find().fetch();
            console.log('Preparing to store timepoints');
            console.log(JSON.stringify(timepointData, null, 2));
            
            storeFn(timepointData).then(() => {
                console.log('Timepoint storage completed');
            });
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
            var followupTimepoints = this.timepoints.find({
                patientId: timepoint.patientId,
                timepointType: timepoint.timepointType
            }, {
                sort: {
                    latestDate: 1
                }
            });

            // Create an array of just timepointIds, so we can use indexOf
            // on it to find the current timepoint's relative position
            var followupTimepointIds = followupTimepoints.map(function(timepoint) {
                return timepoint.timepointId;
            });

            // Calculate the index of the current timepoint in the array of all
            // relevant follow-up timepoints
            var index = followupTimepointIds.indexOf(timepoint.timepointId) + 1;

            // If index is 0, it means that the current timepoint was not in the list
            // Log a warning and return here
            if (!index) {
                log.warn('Current follow-up was not in the list of relevant follow-ups?');
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

    return TimepointApi;
}

export const TimepointsConfiguration = {
    setConfiguration: setConfiguration,
    getConfiguration: getConfiguration,
    getTimepointsApi: getTimepointsApi
};