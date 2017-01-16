import { BaseCriterion } from './BaseCriterion';

export const NonTargetResponseSchema = {
    type: 'object'
};

/* NonTargetResponseCriterion
 *   Check if the there are non-target measurements with response different than "present" on baseline
 */
export class NonTargetResponseCriterion extends BaseCriterion {

    constructor(options) {
        super(options);
    }

    evaluate(data) {
        const items = data.nonTargets;
        const measurements = [];
        let message;

        items.forEach(item => {
            const measurement = item.measurement;
            const response = (measurement.response || '').toLowerCase();

            if (response !== 'present') {
                measurements.push(measurement);
            }
        });

        if (measurements.length) {
            message = 'Non-targets can only be assessed as "present"';
        }

        return this.generateResponse(message, measurements);
    }

}
