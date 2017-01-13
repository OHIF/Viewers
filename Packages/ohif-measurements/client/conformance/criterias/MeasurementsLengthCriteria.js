import { BaseCriteria } from './BaseCriteria';

export class MeasurementsLengthCriteria extends BaseCriteria {

    constructor(options) {
        super();
        this.options = options;
    }

    check(data) {
        let message;
        let measurements = [];
        const { options } = this;
        const longMultiplier = options.longAxisSliceThicknessMultiplier;
        const shortMultiplier = options.shortAxisSliceThicknessMultiplier;

        data.targets.forEach(item => {
            const { measurement, metadata } = item;
            const { location, longestDiameter, shortestDiameter } = measurement;
            const { sliceThickness } = metadata;
            const modality = metadata.modality.toUpperCase();

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

        return this.respond(message, measurements);
    }

}
