import { BaseChecker } from './BaseChecker';
import { MaxTargetPerOrganCriteria } from '../criterias/MaxTargetPerOrganCriteria';
import { MaxTargetsCriteria } from '../criterias/MaxTargetsCriteria';

export class RecistChecker extends BaseChecker {

    constructor() {
        super();

        this.criterias.push(new MaxTargetsCriteria(5));
        this.criterias.push(new MaxTargetPerOrganCriteria(2));
    }

    check(data) {
        const nonconformity = [];
        this.criterias.forEach(criteria => {
            const criteriaResult = criteria.check(data);
            if (!criteriaResult.passed) {
                nonconformity.push(criteriaResult);
            }
        });
        return nonconformity;
    }

}
