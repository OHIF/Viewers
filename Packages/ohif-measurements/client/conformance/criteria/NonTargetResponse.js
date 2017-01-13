import { BaseCriterion } from './BaseCriterion';

export class NonTargetResponseCriterion extends BaseCriterion {

    constructor() {
        super();
    }

    evaluate(data) {
        const items = data.nonTargets;
        const measurements = [];
        let message;

        items.forEach(item => {
            const measurement = item.measurement;
            const response = measurement.response.toLowerCase();
            const timepoint = item.timepoint;
            const timepointType = timepoint.timepointType.toLowerCase();

            if ((timepointType === 'baseline') && (response !== 'present')) {
                measurements.push(measurement);
            }
        });

        if (measurements.length) {
            message = 'Non-targets can only be assessed as "present"';
        }

        return this.generateResponse(message, measurements);
    }

}
