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

    // Return only the current and prior timepoints
    latest() {
        const options = {
            limit: 2
        };
        return this.timepoints.find({}, options).fetch();
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
