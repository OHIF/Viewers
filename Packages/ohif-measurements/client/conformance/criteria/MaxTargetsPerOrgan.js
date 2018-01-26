import { _ } from 'meteor/underscore';
import { BaseCriterion } from './BaseCriterion';

export const MaxTargetsPerOrganSchema = {
    type: 'object',
    properties: {
        limit: {
            label: 'Max targets allowed per organ',
            type: 'integer',
            minimum: 1
        },
        newTarget: {
            label: 'Flag to evaluate only new targets',
            type: 'boolean'
        }
    },
    required: ['limit']
};

/*
 * MaxTargetsPerOrganCriterion
 *   Check if the number of target measurements per organ exceeded the limit allowed
 * Options:
 *   limit: Max targets allowed in study
 *   newTarget: Flag to evaluate only new targets (must be evaluated on both)
 */
export class MaxTargetsPerOrganCriterion extends BaseCriterion {

    constructor(options) {
        super(options);
    }

    evaluate(data) {
        const { options } = this;
        const targetsPerOrgan = {};
        let measurements = [];

        const newTargetNumbers = this.getNewTargetNumbers(data);
        _.each(data.targets, target => {
            const { measurement } = target;
            const { location, measurementNumber, isSplitLesion } = measurement;

            if (isSplitLesion) return;

            if (!targetsPerOrgan[location]) {
                targetsPerOrgan[location] = new Set();
            }

            if (!options.newTarget || newTargetNumbers.has(measurementNumber)) {
                targetsPerOrgan[location].add(measurementNumber);
            }

            if (targetsPerOrgan[location].size > options.limit) {
                measurements.push(measurement);
            }
        });

        let message;
        if (measurements.length) {
            const increment = options.newTarget ? 'new ' : '';
            message = options.message || `Each organ should not have more than ${options.limit} ${increment}targets.`;
        }

        return this.generateResponse(message, measurements);
    }

}
