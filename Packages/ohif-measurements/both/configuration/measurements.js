import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';

import { OHIF } from 'meteor/ohif:core';

let configuration = {};

class MeasurementApi {
    static setConfiguration(config) {
        configuration = config;
    }

    static getConfiguration() {
        return configuration;
    }

    constructor(currentTimepointId, configuration) {
        if (currentTimepointId) {
            this.currentTimepointId = currentTimepointId;
        }

        this.config = configuration || MeasurementApi.getConfiguration();

        this.config.measurementTools.forEach(tool => {
            const measurementTypeId = tool.id;

            this[measurementTypeId] = new Mongo.Collection(null);
            this[measurementTypeId].attachSchema(tool.schema);
        });
    }

    retrieveMeasurements(timepointId) {
        if (!timepointId) {
            timepointId = this.currentTimepointId;
        }

        const retrievalFn = this.config.dataExchange.retrieve;
        if (!_.isFunction(retrievalFn)) {
            return;
        }

        return new Promise((resolve, reject) => {
            retrievalFn().then(measurementData => {
                // TODO: implement converter here

                console.log('Measurement data retrieval');
                console.log(measurementData);

                Object.keys(measurementData).forEach(measurementTypeId => {
                    const measurements = measurementData[measurementTypeId];

                    measurements.forEach(measurement => {
                        delete measurement._id;
                        this[measurementTypeId].insert(measurement);
                    });
                });

                resolve();
            });
        });
    }

    storeMeasurements(timepointId) {
        const storeFn = this.config.dataExchange.store;
        if (!_.isFunction(storeFn)) {
            return;
        }

        let measurementData = {};
        this.config.measurementTools.forEach(tool => {
            const measurementTypeId = tool.id;
            measurementData[measurementTypeId] = this[measurementTypeId].find().fetch();
        });

        storeFn(measurementData).then(() => {
            console.log('Measurement storage completed');
        });
    }

    validateMeasurements() {
        const validateFn = this.config.dataValidation.validateMeasurements;
        if (validateFn && validateFn instanceof Function) {
            validateFn();
        }
    }

    syncMeasurementsAndToolData() {
        this.config.measurementTools.forEach(tool => {
            const measurements = this[tool.id].find().fetch();
            measurements.forEach(measurement => {
                syncMeasurementAndToolData(measurement);
            });
        });
    }

    fetch(measurementTypeId, selector, options) {
        if (!this[measurementTypeId]) {
            throw 'MeasurementApi: No Collection with the id: ' + measurementTypeId;
        }

        selector = selector || {};
        options = options || {};
        return this[measurementTypeId].find(selector, options).fetch();
    }
}

OHIF.measurements.MeasurementApi = MeasurementApi;
