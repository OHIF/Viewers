import { BaseCriteria } from './BaseCriteria';
import { _ } from 'meteor/underscore';

export class MaxTargetsCriteria extends BaseCriteria {

    constructor(targetsLimit) {
        super();
        this.targetsLimit = targetsLimit;
    }

    check(data) {
        const measurementNumbers = _.uniq(_.map(data.targets, target => {
            return target.measurement.measurementNumber;
        }));

        let message;
        if (measurementNumbers.length > this.targetsLimit) {
            message = `The study should not have more than ${this.targetsLimit} targets.`;
        }

        return this.respond(message);
    }

}
