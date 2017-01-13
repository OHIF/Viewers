import { BaseChecker } from './BaseChecker';
import { MaxTargetPerOrganCriteria } from '../criterias/MaxTargetPerOrganCriteria';
import { MaxTargetsCriteria } from '../criterias/MaxTargetsCriteria';
import { MeasurementsLengthCriteria } from '../criterias/MeasurementsLengthCriteria';
import { ModalityCriteria } from '../criterias/ModalityCriteria';
import { NonTargetResponseCriteria } from '../criterias/NonTargetResponseCriteria';

export class RecistChecker extends BaseChecker {

    constructor() {
        super();

        this.criterias.push(new MaxTargetsCriteria(5));
        this.criterias.push(new MaxTargetPerOrganCriteria(2));
        this.criterias.push(new MeasurementsLengthCriteria({}));
        this.criterias.push(new ModalityCriteria(this.getModalityCriteriaOptions()));
        this.criterias.push(new NonTargetResponseCriteria());
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

    getModalityCriteriaOptions() {
        return {
            method: 'restrict',
            modalities: ['US']
        };
    }

}
