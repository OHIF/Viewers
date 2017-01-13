import * as Criteria from './criteria';
import { _ } from 'meteor/underscore';

export class CriteriaEvaluator {

    constructor(criteriaObject) {
        this.criteria = [];

        _.each(criteriaObject, (optionsObject, criterionkey) => {
            const Criterion = Criteria[`${criterionkey}Criterion`];
            if (optionsObject instanceof Array) {
                _.each(optionsObject, options => {
                    const criterion = new Criterion(options);
                    this.criteria.push(criterion);
                });
            } else {
                this.criteria.push(new Criterion(optionsObject));
            }
        });
    }

    evaluate(data) {
        const nonconformity = [];
        this.criteria.forEach(criterion => {
            const criterionResult = criterion.evaluate(data);
            if (!criterionResult.passed) {
                nonconformity.push(criterionResult);
            }
        });
        return nonconformity;
    }

}
