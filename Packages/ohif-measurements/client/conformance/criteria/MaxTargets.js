import { BaseCriterion } from './BaseCriterion';
import { _ } from 'meteor/underscore';

export const MaxTargetsSchema = {
    type: 'object',
    properties: {
        limit: {
            label: 'Max targets allowed in study',
            type: 'integer',
            minimum: 1
        }
    },
    locationIn: {
        label: 'Filter to evaluate only measurements with the specified locations',
        type: 'array',
        items: {
            type: 'string'
        },
        minItems: 1,
        uniqueItems: true
    },
    locationNotIn: {
        label: 'Filter to evaluate only measurements without the specified locations',
        type: 'array',
        items: {
            type: 'string'
        },
        minItems: 1,
        uniqueItems: true
    },
    required: ['limit']
};

/* MaxTargetsCriterion
 *   Check if the number of target measurements exceeded the limit allowed
 * Options:
 *   limit: Max targets allowed in study
 *   locationIn: Filter to evaluate only measurements with the specified locations
 *   locationNotIn: Filter to evaluate only measurements without the specified locations
 *   message: Message to be displayed in case of nonconformity
 */
export class MaxTargetsCriterion extends BaseCriterion {

    constructor(options) {
        super(options);
    }

    evaluate(data) {
        const { options } = this;
        const measurementNumbers = [];
        _.each(data.targets, target => {
            const { location } = target.measurement;
            if (options.locationIn && options.locationIn.indexOf(location) === -1) return;
            if (options.locationNotIn && options.locationNotIn.indexOf(location) > -1) return;
            measurementNumbers.push(target.measurement.measurementNumber);
        });

        let message = options.message;
        if (!message && measurementNumbers.length > this.options.limit) {
            message = `The study should not have more than ${this.options.limit} targets.`;
        }

        return this.generateResponse(message);
    }

}
