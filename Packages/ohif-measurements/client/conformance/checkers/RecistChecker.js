import { BaseChecker } from './BaseChecker';
import { MaxTargetPerOrganCriteria } from '../criterias/MaxTargetPerOrganCriteria';
import { MaxTargetsCriteria } from '../criterias/MaxTargetsCriteria';
import { MeasurementsLengthCriteria } from '../criterias/MeasurementsLengthCriteria';
import { ModalityCriteria } from '../criterias/ModalityCriteria';
import { NonTargetResponseCriteria } from '../criterias/NonTargetResponseCriteria';
import { TargetTypeCriteria } from '../criterias/TargetTypeCriteria';

export class RecistChecker extends BaseChecker {

    constructor() {
        super();

        const addCriteria = criteria => this.criterias.push(criteria);

        addCriteria(new MaxTargetsCriteria(5));
        addCriteria(new MaxTargetPerOrganCriteria(2));
        addCriteria(new ModalityCriteria(this.getModalityCriteriaOptions()));
        addCriteria(new NonTargetResponseCriteria());
        addCriteria(new TargetTypeCriteria());
        addCriteria(new MeasurementsLengthCriteria(this.getExtranodalLengthCriteriaOptions()));
        addCriteria(new MeasurementsLengthCriteria(this.getExtranodalXrayLengthCriteriaOptions()));
        addCriteria(new MeasurementsLengthCriteria(this.getNodalLengthCriteriaOptions()));
    }

    getModalityCriteriaOptions() {
        return {
            method: 'restrict',
            modalities: ['US']
        };
    }

    getExtranodalLengthCriteriaOptions() {
        return {
            longAxis: 10,
            longAxisSliceThicknessMultiplier: 2,
            modalityIn: ['CT', 'MR'],
            locationNotIn: ['Lymph Node'],
            message: 'Extranodal lesions must be >= 10mm long axis AND ' +
            '>= double the acquisition slice thickness by CT and MR'
        };
    }

    getExtranodalXrayLengthCriteriaOptions() {
        return {
            shortAxis: 20,
            longAxis: 20,
            modalityIn: ['PX', 'XA'],
            locationNotIn: ['Lymph Node'],
            message: 'Extranodal lesions must be >= 20mm on chest x-ray ' +
            '(although x-rays rarely used for clinical trial assessment)'
        };
    }

    getNodalLengthCriteriaOptions() {
        return {
            shortAxis: 15,
            shortAxisSliceThicknessMultiplier: 2,
            modalityIn: ['CT', 'MR'],
            locationIn: ['Lymph Node'],
            message: 'Nodal lesions must be >= 15mm short axis AND ' +
            '>= double the acquisition slice thickness by CT and MR'
        };
    }

}
