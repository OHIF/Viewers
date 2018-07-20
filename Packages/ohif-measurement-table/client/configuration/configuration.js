import { OHIF } from 'meteor/ohif:core';

import { measurementTools } from './measurementTools';
import { retrieveMeasurements, storeMeasurements, retrieveTimepoints, storeTimepoints, removeTimepoint, updateTimepoint, disassociateStudy } from './dataExchange';

export const configureApis = () => {
    OHIF.measurements.MeasurementApi.setConfiguration({
        measurementTools,
        dataExchange: {
            retrieve: retrieveMeasurements,
            store: storeMeasurements
        },
        dataValidation: {
            validation: () => {}
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
};
