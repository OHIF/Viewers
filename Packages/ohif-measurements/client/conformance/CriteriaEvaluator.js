import * as Criteria from './criteria';
import { _ } from 'meteor/underscore';

export class CriteriaEvaluator {

    constructor(criteriaObject) {
        this.criteria = [];

        _.each(criteriaObject, (optionsObject, criterionkey) => {
            const Criterion = Criteria[`${criterionkey}Criterion`];
            const optionsArray = optionsObject instanceof Array ? optionsObject : [optionsObject];
            _.each(optionsArray, options => {
                const validator = Criteria[`${criterionkey}Validator`];
                if (!validator(options)) {
                    let message = `Invalid ${criterionkey}Criterion definition.`;
                    _.each(validator.errors, error => {
                        message += `\noptions${error.dataPath} ${error.message}`;
                    });
                    throw new Error(message);
                }

                const criterion = new Criterion(options);
                this.criteria.push(criterion);
            });
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
