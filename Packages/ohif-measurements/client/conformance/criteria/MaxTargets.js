import { BaseCriterion } from './BaseCriterion';
import { _ } from 'meteor/underscore';

export class MaxTargetsCriterion extends BaseCriterion {

    constructor(targetsLimit) {
        super();
        this.targetsLimit = targetsLimit;
    }

    evaluate(data) {
        const measurementNumbers = _.uniq(_.map(data.targets, target => {
            return target.measurement.measurementNumber;
        }));

        let message;
        if (measurementNumbers.length > this.targetsLimit) {
            message = `The study should not have more than ${this.targetsLimit} targets.`;
        }

        return this.generateResponse(message);
    }

}
