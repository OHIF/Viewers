import { BaseCriterion } from './criteria/BaseCriterion';
import * as initialCriteria from './criteria';
import Ajv from 'ajv';

const Criteria = Object.assign({}, initialCriteria);

export class CriteriaEvaluator {
  constructor(criteriaObject) {
    const criteriaValidator = this.getCriteriaValidator();
    this.criteria = [];

    if (!criteriaValidator(criteriaObject)) {
      let message = '';
      criteriaValidator.errors.forEach(error => {
        message += `\noptions${error.dataPath} ${error.message}`;
      });
      throw new Error(message);
    }

    Object.keys(criteriaObject).forEach(criterionkey => {
      const optionsObject = criteriaObject[criterionkey];
      const Criterion = Criteria[`${criterionkey}Criterion`];
      const optionsArray =
        optionsObject instanceof Array ? optionsObject : [optionsObject];
      optionsArray.forEach(options =>
        this.criteria.push(new Criterion(options, criterionkey))
      );
    });
  }

  getMaxTargets(newTarget = false) {
    let result = 0;
    this.criteria.forEach(criterion => {
      const newTargetMatch = newTarget === !!criterion.options.newTarget;
      if (criterion instanceof Criteria.MaxTargetsCriterion && newTargetMatch) {
        const { limit } = criterion.options;
        if (limit > result) {
          result = limit;
        }
      }
    });
    return result;
  }

  getCriteriaValidator() {
    if (CriteriaEvaluator.criteriaValidator) {
      return CriteriaEvaluator.criteriaValidator;
    }

    const schema = {
      properties: {},
      definitions: {},
    };

    Object.keys(Criteria).forEach(key => {
      const Criterion = Criteria[key];
      if (Criterion.prototype instanceof BaseCriterion) {
        const criterionkey = key.replace(/Criterion$/, '');
        const criterionDefinition = `#/definitions/${criterionkey}`;

        schema.definitions[criterionkey] = Criteria[`${criterionkey}Schema`];
        schema.properties[criterionkey] = {
          oneOf: [
            { $ref: criterionDefinition },
            {
              type: 'array',
              items: {
                $ref: criterionDefinition,
              },
            },
          ],
        };
      }
    });

    CriteriaEvaluator.criteriaValidator = new Ajv().compile(schema);
    return CriteriaEvaluator.criteriaValidator;
  }

  evaluate(data) {
    const nonconformities = [];
    this.criteria.forEach(criterion => {
      const criterionResult = criterion.evaluate(data);
      if (!criterionResult.passed) {
        nonconformities.push(criterionResult);
      }
    });
    return nonconformities;
  }

  static setCriterion(criterionKey, criterionDefinitions) {
    Criteria[criterionKey] = criterionDefinitions;
  }
}
