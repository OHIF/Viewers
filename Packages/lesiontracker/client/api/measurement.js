const hasValueAtTimepoint = timepointId => {
    return measurement => {
        if (measurement.timepoints[timepointId]) {
            return true;
        }
    };
};

const hasNoValueAtTimepoint = timepointId => {
    return measurement => {
        if (measurement.timepoints[timepointId] === undefined) {
            return true;
        }
    };
};

export const MeasurementApi = {
    sortOptions: {
        sort: {
            lesionNumberAbsolute: 1
        }
    },

    // Return all Measurements
    all(withPriors=false) {
        let data = Measurements.find({}, this.sortOptions).fetch();

        // If we don't have a prior for this Timepoint,
        // this filter, we should just return all of the
        // available Non-Targets measurements
        if (this.priorTimepointId && withPriors === true) {
            return data.filter(hasValueAtTimepoint(this.priorTimepointId))
        }

        return data;
    },

    unmarked() {
        const withPriors = true;
        return this.all(withPriors).filter(hasNoValueAtTimepoint(this.currentTimepointId));;
    },

    unmarkedTargets() {
        const withPriors = true;
        return this.targets(withPriors).filter(hasNoValueAtTimepoint(this.currentTimepointId));;
    },

    unmarkedNonTargets() {
        const withPriors = true;
        return this.nonTargets(withPriors).filter(hasNoValueAtTimepoint(this.currentTimepointId));;
    },

    // Return only Target Measurements
    targets(withPriors=false) {
        let data = Measurements.find({
            isTarget: true
        }, this.sortOptions).fetch();

        // If we don't have a prior for this Timepoint,
        // this filter, we should just return all of the
        // available Non-Targets measurements
        if (this.priorTimepointId && withPriors === true) {
            return data.filter(hasValueAtTimepoint(this.priorTimepointId))
        }

        return data;
    },

    // Return only Non-Target Measurements
    nonTargets(withPriors=false) {
        let data = Measurements.find({
            isTarget: false
        }, this.sortOptions).fetch();

        // If we don't have a prior for this Timepoint,
        // this filter, we should just return all of the
        // available Non-Targets measurements
        if (this.priorTimepointId && withPriors === true) {
            return data.filter(hasValueAtTimepoint(this.priorTimepointId))
        }

        return data;
    },

    // Return only New Lesions
    newLesions() {
        // If we are current editing a Baseline we won't have any priors, so newLesions
        // should return an empty array.
        if (!this.priorTimepointId) {
            return [];
        }

        // Find only lesions that have no value at the previous timepoint
        return this.all().filter(hasNoValueAtTimepoint(this.priorTimepointId));
    },

    firstLesion() {
        return Measurements.findOne({
            target: true
        }, this.sortOptions);
    }
};
