import { _ } from 'meteor/underscore';
import { BaseCriterion } from './BaseCriterion';

export const MaxTargetsSchema = {
    type: 'object',
    properties: {
        limit: {
            label: 'Max targets allowed in study',
            type: 'integer',
            minimum: 0
        },
        newTarget: {
            label: 'Flag to evaluate only new targets',
            type: 'boolean'
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
        }
    },
    required: ['limit']
};

/* MaxTargetsCriterion
 *   Check if the number of target measurements exceeded the limit allowed
 * Options:
 *   limit: Max targets allowed in study
 *   newTarget: Flag to evaluate only new targets (must be evaluated on both)
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

        const newTargetNumbers = this.getNewTargetNumbers(data);
        const measurementNumbers = [];
        _.each(data.targets, target => {
            const { location, measurementNumber, isSplitLesion } = target.measurement;
            if (isSplitLesion) return;
            if (options.newTarget && !newTargetNumbers.has(measurementNumber)) return;
            if (options.locationIn && options.locationIn.indexOf(location) === -1) return;
            if (options.locationNotIn && options.locationNotIn.indexOf(location) > -1) return;
            measurementNumbers.push(measurementNumber);
        });

        let message;
        if (measurementNumbers.length > options.limit) {
            const increment = options.newTarget ? 'new ' : '';
            const plural = options.limit === 1 ? '' : 's';
            const amount = options.limit === 0 ? '' : `more than ${options.limit}`;
            message = options.message || `The study should not have ${amount} ${increment}target${plural}.`;
        }

        return this.generateResponse(message);
    }

}
