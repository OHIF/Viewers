import { BaseCriterion } from './BaseCriterion';

export const MaxTargetsPerOrganSchema = {
    properties: {
        limit: {
            label: 'Max targets allowed per organ',
            type: 'integer',
            minimum: 1
        }
    },
    required: ['limit']
};

export class MaxTargetsPerOrganCriterion extends BaseCriterion {

    constructor(options) {
        super(options);
    }

    evaluate(data) {
        const targetsPerOrgan = {};
        let message;
        let measurements = [];

        for (let i = 0; i < data.targets.length; i++) {
            const measurement = data.targets[i].measurement;
            const { location, measurementNumber } = measurement;
            if (!targetsPerOrgan[location]) {
                targetsPerOrgan[location] = new Set();
            }

            targetsPerOrgan[location].add(measurementNumber);
            if (targetsPerOrgan[location].size > this.options.limit) {
                measurements.push(measurement);
            }
        }

        if (measurements.length) {
            message = `Each organ should not have more than ${this.options.limit} targets.`;
        }

        return this.generateResponse(message, measurements);
    }

}
