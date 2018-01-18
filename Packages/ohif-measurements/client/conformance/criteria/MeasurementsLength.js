import { BaseCriterion } from './BaseCriterion';

export const MeasurementsLengthSchema = {
    type: 'object',
    properties: {
        longAxis: {
            label: 'Minimum length of long axis',
            type: 'number',
            minimum: 0
        },
        shortAxis: {
            label: 'Minimum length of short axis',
            type: 'number',
            minimum: 0
        },
        longAxisSliceThicknessMultiplier: {
            label: 'Length of long axis multiplier',
            type: 'number',
            minimum: 0
        },
        shortAxisSliceThicknessMultiplier: {
            label: 'Length of short axis multiplier',
            type: 'number',
            minimum: 0
        },
        modalityIn: {
            label: 'Filter to evaluate only measurements with the specified modalities',
            type: 'array',
            items: {
                type: 'string'
            },
            minItems: 1,
            uniqueItems: true
        },
        modalityNotIn: {
            label: 'Filter to evaluate only measurements without the specified modalities',
            type: 'array',
            items: {
                type: 'string'
            },
            minItems: 1,
            uniqueItems: true
        },
        locationIn: {
            label: 'Filter to evaluate only measurements with the specified locations',
            type: 'array',
            items: {
                type: 'string'
            },
            minItems: 1,
            uniqueItems: true
        },
        locationNotIn: {
            label: 'Filter to evaluate only measurements without the specified locations',
            type: 'array',
            items: {
                type: 'string'
            },
            minItems: 1,
            uniqueItems: true
        },
        message: {
            label: 'Message to be displayed in case of nonconformity',
            type: 'string'
        }
    },
    anyOf: [
        { required: ['message', 'longAxis'] },
        { required: ['message', 'shortAxis'] },
        { required: ['message', 'longAxisSliceThicknessMultiplier'] },
        { required: ['message', 'shortAxisSliceThicknessMultiplier'] }
    ]
};

/*
 * MeasurementsLengthCriterion
 *   Check the measurements of all bidirectional tools based on
 *   short axis, long axis, modalities, location and slice thickness
 * Options:
 *   longAxis: Minimum length of long axis
 *   shortAxis: Minimum length of short axis
 *   longAxisSliceThicknessMultiplier: Length of long axis multiplier
 *   shortAxisSliceThicknessMultiplier: Length of short axis multiplier
 *   modalityIn: Filter to evaluate only measurements with the specified modalities
 *   modalityNotIn: Filter to evaluate only measurements without the specified modalities
 *   locationIn: Filter to evaluate only measurements with the specified locations
 *   locationNotIn: Filter to evaluate only measurements without the specified locations
 *   message: Message to be displayed in case of nonconformity
 */
export class MeasurementsLengthCriterion extends BaseCriterion {

    constructor(options) {
        super(options);
    }

    evaluate(data) {
        let message;
        let measurements = [];
        const { options } = this;
        const longMultiplier = options.longAxisSliceThicknessMultiplier;
        const shortMultiplier = options.shortAxisSliceThicknessMultiplier;

        data.targets.forEach(item => {
            const { measurement, metadata } = item;
            const { location, longestDiameter, shortestDiameter } = measurement;
            const { sliceThickness } = metadata;
            const modality = (metadata.getRawValue('x00080060') || '').toUpperCase();

            // Stop here if the measurement does not match the modality and location filters
            if (options.locationIn && options.locationIn.indexOf(location) === -1) return;
            if (options.modalityIn && options.modalityIn.indexOf(modality) === -1) return;
            if (options.locationNotIn && options.locationNotIn.indexOf(location) > -1) return;
            if (options.modalityNotIn && options.modalityNotIn.indexOf(modality) > -1) return;

            // Check the measurement length
            const failed = (
                (options.longAxis && longestDiameter < options.longAxis) ||
                (options.shortAxis && shortestDiameter < options.shortAxis) || (
                    longMultiplier && !isNaN(sliceThickness) &&
                    longestDiameter < (longMultiplier * sliceThickness)
                ) || (
                    shortMultiplier && !isNaN(sliceThickness) &&
                    shortestDiameter < (shortMultiplier * sliceThickness)
                )
            );

            // Mark this measurement as invalid if some of the checks have failed
            if (failed) {
                measurements.push(measurement);
            }
        });

        // Use the options' message if some measurement is invalid
        if (measurements.length) {
            message = options.message;
        }

        return this.generateResponse(message, measurements);
    }

}
