import { OHIF } from 'meteor/ohif:core';

import { measurementTools } from './measurementTools';
import { retrieveMeasurements, storeMeasurements, retrieveTimepoints, storeTimepoints, removeTimepoint, updateTimepoint, disassociateStudy } from './dataExchange';
import { FieldLesionLocation, FieldLesionLocationResponse } from 'meteor/ohif:measurement-table/client/schema/fields';

OHIF.measurements.MeasurementApi.setConfiguration({
    measurementTools,
    newLesions: [{
        id: 'allTools',
        name: 'All Tools',
        toolGroupId: 'allTools'
    }],
    dataExchange: {
        retrieve: retrieveMeasurements,
        store: storeMeasurements
    },
    dataValidation: {
        validation: () => {}
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
