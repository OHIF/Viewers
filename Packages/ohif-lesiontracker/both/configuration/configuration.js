import { measurementTools } from './measurementTools';
import { retrieveMeasurements, storeMeasurements, retrieveTimepoints, storeTimepoints } from './dataExchange';
import { validateMeasurements } from './dataValidation';

import { MeasurementsConfiguration } from 'meteor/ohif:measurements/both/configuration/measurements';
import { TimepointsConfiguration } from 'meteor/ohif:measurements/both/configuration/timepoints';

console.log('OHIF-LesionTracker: Defining Configuration for Measurements');

const newMeasurementTool = {
	id: 'newLesions',
	name: 'New Lesions'
};

MeasurementsConfiguration.setConfiguration({
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

TimepointsConfiguration.setConfiguration({
	dataExchange: {
		retrieve: retrieveTimepoints,
		store: storeTimepoints
	}
});