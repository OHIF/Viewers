import { BaseCriterion } from './criteria/BaseCriterion';
import * as Criteria from './criteria';
import { _ } from 'meteor/underscore';
import Ajv from 'ajv';

export class CriteriaEvaluator {

    constructor(criteriaObject) {
        this.criteria = [];

        const schema = {
            properties: {},
            definitions: {
                simpleArray: { type: 'array' }
            }
        };
        _.each(Criteria, (Criterion, key) => {
            if (Criterion.prototype instanceof BaseCriterion) {
                const criterionkey = key.replace(/Criterion$/, '');
                schema.definitions[criterionkey] = Criteria[`${criterionkey}Schema`];
                schema.properties[criterionkey] = {
                    oneOf: [
                        { $ref: '#/definitions/simpleArray' },
                        { $ref: `#/definitions/${criterionkey}` }
                    ]
                };
            }
        });
        const validator = new Ajv().compile(schema);
        if (!validator(criteriaObject)) {
            let message = '';
            _.each(validator.errors, error => {
                message += `\noptions${error.dataPath} ${error.message}`;
            });
            throw new Error(message);
        }

        _.each(criteriaObject, (optionsObject, criterionkey) => {
            const Criterion = Criteria[`${criterionkey}Criterion`];
            const optionsArray = optionsObject instanceof Array ? optionsObject : [optionsObject];
            _.each(optionsArray, options => this.criteria.push(new Criterion(options)));
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
