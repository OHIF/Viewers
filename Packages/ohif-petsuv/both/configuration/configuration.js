import { measurementTools } from './measurementTools';
import { retrieveMeasurements, storeMeasurements } from './dataExchange';
import { validateMeasurements } from './dataValidation';

import { MeasurementsConfiguration } from 'meteor/ohif:measurements/both/configuration/measurements';

console.log('OHIF-PET SUV: Defining Configuration for Measurements');
MeasurementsConfiguration.setConfiguration({
	measurementTools: measurementTools,
	dataExchange: {
		retrieve: retrieveMeasurements,
		store: storeMeasurements
	},
	dataValidation: {
		validation: validateMeasurements
	}
});