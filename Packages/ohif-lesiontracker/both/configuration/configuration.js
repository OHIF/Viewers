import { OHIF } from 'meteor/ohif:core';

import { measurementTools } from './measurementTools';
import { retrieveMeasurements, storeMeasurements, retrieveTimepoints, storeTimepoints } from './dataExchange';
import { validateMeasurements } from './dataValidation';

console.log('OHIF-LesionTracker: Defining Configuration for Measurements');

const newMeasurementTool = {
    id: 'newLesions',
    name: 'New Lesions'
};

OHIF.measurements.MeasurementApi.setConfiguration({
    measurementTools: measurementTools,
    newMeasurementTool: newMeasurementTool,
    dataExchange: {
        retrieve: retrieveMeasurements,
        store: storeMeasurements
    },
    dataValidation: {
        validation: validateMeasurements
    }
});

OHIF.measurements.TimepointApi.setConfiguration({
    dataExchange: {
        retrieve: retrieveTimepoints,
        store: storeTimepoints
    }
});
