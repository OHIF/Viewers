let Configuration = {};

function setConfiguration(config) {
	Configuration = config;
}

function getConfiguration() {
	return Configuration;
}

function getMeasurementsApi() {
	console.log('OHIF-Measurements: Defining MeasurementApi');
	const config = Configuration;

	class MeasurementApi {
		constructor(currentTimepointId) {
            if (currentTimepointId) {
                this.currentTimepointId = currentTimepointId;
            }
		}

	    retrieveMeasurements(timepointId) {
	    	if (!timepointId) {
	    		timepointId = this.currentTimepointId;
	    	}

            const retrievalFn = config.dataExchange.retrieve;
            if (!_.isFunction(retrievalFn)) {
                return;
            }

            return new Promise((resolve, reject) => {
            	retrievalFn().then(measurementData => {
	                console.log('Measurement data retrieval');
	                console.log(measurementData);

	                Object.keys(measurementData).forEach(measurementTypeId => {
	                	const measurements = measurementData[measurementTypeId];

	                	measurements.forEach(measurement => {
	                		delete measurement._id;
	                		this[measurementTypeId].insert(measurement);	
	                	})
                	});

                	resolve();
            	});
            });
	    }

	    storeMeasurements(timepointId) {
	        const storeFn = config.dataExchange.store;
            if (!_.isFunction(storeFn)) {
                return;
            }

            let measurementData = {};
	        config.measurementTools.forEach(tool => {
	    		const measurementTypeId = tool.id;
	    		measurementData[measurementTypeId] = this[measurementTypeId].find().fetch();
	    	});

	    	storeFn(measurementData).then(() => {
	    		console.log('Measurement storage completed');
	    	});
	    }

	    validateMeasurements() {
	        const validateFn = config.dataValidation.validateMeasurements;
	        if (validateFn && validateFn instanceof Function) {
	            validateFn();
	        }   
	    }

	    syncMeasurementsAndToolData() {
			config.measurementTools.forEach(tool => {
				const measurements = this[tool.id].find().fetch();
				measurements.forEach(measurement => {
					syncMeasurementAndToolData(measurement);
				})
			});	    	
	    }
	}

	config.measurementTools.forEach(tool => {
	    const measurementTypeId = tool.id;

	    MeasurementApi.prototype[measurementTypeId] = new Mongo.Collection(null);
	    MeasurementApi.prototype[measurementTypeId].attachSchema(tool.schema);

	    MeasurementApi.prototype.fetch = (measurementTypeId, selector, options) => {
	    	if (!this[measurementTypeId]) {
	    		throw 'MeasurementApi: No Collection with the id: ' + measurementTypeId;
	    	}

	        selector = selector || {};
	        options = options || {};
	        return this[measurementTypeId].find(selector, options).fetch();
	    };
	});

	return MeasurementApi;
}

export const MeasurementsConfiguration = {
	setConfiguration: setConfiguration,
	getConfiguration: getConfiguration,
	getMeasurementsApi: getMeasurementsApi
};