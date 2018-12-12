import { OHIF } from 'meteor/ohif:core';

class MeasurementManager {

    /**
     * If the current Measurements Number already exists
     * for any other timepoint, returns lesion locationUID
     * @param measurementData
     * @returns {number} - Measurement location ID
     */
    static getLocationIdIfMeasurementExists(measurementData, collection) {
        const measurement = collection.findOne({
            measurementNumber: measurementData.measurementNumber
        });

        if (!measurement) {
            return;
        }

        return measurement.locationId;
    }

}

OHIF.measurements.MeasurementManager = MeasurementManager;
