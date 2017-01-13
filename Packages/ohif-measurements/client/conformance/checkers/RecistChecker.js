import { BaseChecker } from './BaseChecker';
import { MaxTargetPerOrganCriterion } from '../criteria/MaxTargetPerOrgan';
import { MaxTargetsCriterion } from '../criteria/MaxTargets';
import { MeasurementsLengthCriterion } from '../criteria/MeasurementsLength';
import { ModalityCriterion } from '../criteria/Modality';
import { NonTargetResponseCriterion } from '../criteria/NonTargetResponse';
import { TargetTypeCriterion } from '../criteria/TargetType';

export class RecistChecker extends BaseChecker {

    constructor() {
        super();

        const addCriterion = criterion => this.criteria.push(criterion);

        addCriterion(new MaxTargetsCriterion(5));
        addCriterion(new MaxTargetPerOrganCriterion(2));
        addCriterion(new ModalityCriterion(this.getModalityOptions()));
        addCriterion(new NonTargetResponseCriterion());
        addCriterion(new TargetTypeCriterion());
        addCriterion(new MeasurementsLengthCriterion(this.getExtranodalLengthOptions()));
        addCriterion(new MeasurementsLengthCriterion(this.getExtranodalXrayLengthOptions()));
        addCriterion(new MeasurementsLengthCriterion(this.getNodalLengthOptions()));
    }

    getModalityOptions() {
        return {
            method: 'restrict',
            modalities: ['US']
        };
    }

    getExtranodalLengthOptions() {
        return {
            longAxis: 10,
            longAxisSliceThicknessMultiplier: 2,
            modalityIn: ['CT', 'MR'],
            locationNotIn: ['Lymph Node'],
            message: 'Extranodal lesions must be >= 10mm long axis AND ' +
            '>= double the acquisition slice thickness by CT and MR'
        };
    }

    getExtranodalXrayLengthOptions() {
        return {
            shortAxis: 20,
            longAxis: 20,
            modalityIn: ['PX', 'XA'],
            locationNotIn: ['Lymph Node'],
            message: 'Extranodal lesions must be >= 20mm on chest x-ray ' +
            '(although x-rays rarely used for clinical trial assessment)'
        };
    }

    getNodalLengthOptions() {
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
