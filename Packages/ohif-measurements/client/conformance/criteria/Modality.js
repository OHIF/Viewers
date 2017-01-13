import { BaseCriterion } from './BaseCriterion';
import { _ } from 'meteor/underscore';

export const ModalitySchema = {
    properties: {
        method: {
            label: 'Specify if it\'s goinig to "allow" or "restrict" the modalities',
            type: 'string'
        },
        measurementTypes: {
            label: 'List of measurement types that will be evaluated',
            type: 'array',
            items: {
                type: 'string'
            },
            minItems: 1,
            uniqueItems: true
        },
        modalities: {
            label: 'List of allowed/restricted modalities',
            type: 'array',
            items: {
                type: 'string'
            },
            minItems: 1,
            uniqueItems: true
        }
    },
    required: ['method', 'modalities']
};

/*
 * ModalityCriteria
 *   Check if a modality is allowed or restricted
 * Options:
 *   method (string): Specify if it\'s goinig to "allow" or "restrict" the modalities
 *   measurementTypes (string[]): List of measurement types that will be evaluated
 *   modalities (string[]): List of allowed/restricted modalities
 */
export class ModalityCriterion extends BaseCriterion {

    constructor(options) {
        super(options);
    }

    evaluate(data) {
        const measurementTypes = this.options.measurementTypes || ['targets'];
        const modalitiesSet = new Set(this.options.modalities);
        const validationMethod = this.options.method;
        const measurements = [];
        const invalidModalities = [];
        let message;

        measurementTypes.forEach(measurementType => {
            const items = data[measurementType];

            items.forEach(item => {
                const measurement = item.measurement;
                const metadata = item.metadata;
                const modality = metadata.modality.toUpperCase();

                if (((validationMethod === 'allow') && !modalitiesSet.has(modality)) ||
                    ((validationMethod === 'restrict') && modalitiesSet.has(modality))) {
                    measurements.push(measurement);
                    invalidModalities.push(modality);
                }
            });
        });

        if (measurements.length) {
            const uniqueModalities = _.uniq(invalidModalities);
            const uniqueModalitiesText = uniqueModalities.join(', ');
            const modalityText = uniqueModalities.length > 1 ? 'modalities' : 'modality';

            message = `The ${modalityText} ${uniqueModalitiesText} should not be used as a method of measurement`;
        }

        return this.generateResponse(message, measurements);
    }

};
