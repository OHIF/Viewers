class TimepointApi {

    constructor() {
        // Run this computation every time the timepoints are changed
        Tracker.autorun(() => {
            // Get all the timepoints and store it
            this.timepoints = new Mongo.Collection(null);
            const timepoints = Timepoints.find({}, {
                sort: {
                    latestDate: -1
                }
            }).fetch();
            _.each(timepoints, timepoint => this.timepoints.insert(timepoint));
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

    // Build the timepoint title based on its date
    title(timepoint) {
        const timepointName = getTimepointName(timepoint);

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

export { TimepointApi };
