import { OHIF } from 'meteor/ohif:core';

import { measurementTools } from './measurementTools';
import { retrieveMeasurements, storeMeasurements, retrieveTimepoints, storeTimepoints, removeTimepoint, updateTimepoint, disassociateStudy } from './dataExchange';
import { validateMeasurements } from './dataValidation';
import { FieldLesionLocation, FieldLesionLocationResponse } from 'meteor/ohif:lesiontracker/both/schema/fields';

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
    },
    schema: {
        nonTargetLocation: FieldLesionLocation,
        nonTargetResponse: FieldLesionLocationResponse
    }
});

OHIF.measurements.TimepointApi.setConfiguration({
    dataExchange: {
        retrieve: retrieveTimepoints,
        store: storeTimepoints,
        remove: removeTimepoint,
        update: updateTimepoint,
        disassociate: disassociateStudy
    }
});
