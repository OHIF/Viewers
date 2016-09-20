import { OHIF } from 'meteor/ohif:core';

import { measurementTools } from './measurementTools';
import { retrieveMeasurements, storeMeasurements } from './dataExchange';
import { validateMeasurements } from './dataValidation';

console.log('OHIF-PET SUV: Defining Configuration for Measurements');
OHIF.measurements.MeasurementApi.setConfiguration({
    measurementTools: measurementTools,
    dataExchange: {
        retrieve: retrieveMeasurements,
        store: storeMeasurements
    },
    dataValidation: {
        validation: validateMeasurements
    }
});
