import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';

import { OHIF } from 'meteor/ohif:core';

let configuration = {};

class MeasurementApi {
    static setConfiguration(config) {
        _.extend(configuration, config);
    }

    static getConfiguration() {
        return configuration;
    }

    constructor(currentTimepointId) {
        if (currentTimepointId) {
            this.currentTimepointId = currentTimepointId;
        }

        configuration.measurementTools.forEach(tool => {
            const measurementTypeId = tool.id;

            this[measurementTypeId] = new Mongo.Collection(null);
            this[measurementTypeId].attachSchema(tool.schema);
        });
    }

    retrieveMeasurements(timepointId) {
        if (!timepointId) {
            timepointId = this.currentTimepointId;
        }

        const retrievalFn = configuration.dataExchange.retrieve;
        if (!_.isFunction(retrievalFn)) {
            return;
        }

        return new Promise((resolve, reject) => {
            retrievalFn(timepointId).then(measurementData => {

                OHIF.log.info('Measurement data retrieval');
                OHIF.log.info(measurementData);

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
        const storeFn = configuration.dataExchange.store;
        if (!_.isFunction(storeFn)) {
            return;
        }

        let measurementData = {};
        configuration.measurementTools.forEach(tool => {
            const measurementTypeId = tool.id;
            measurementData[measurementTypeId] = this[measurementTypeId].find().fetch();
        });

        storeFn(measurementData).then(() => {
            OHIF.log.info('Measurement storage completed');
        });
    }

    validateMeasurements() {
        const validateFn = configuration.dataValidation.validateMeasurements;
        if (validateFn && validateFn instanceof Function) {
            validateFn();
        }
    }

    syncMeasurementsAndToolData() {
        configuration.measurementTools.forEach(tool => {
            const measurements = this[tool.id].find().fetch();
            measurements.forEach(measurement => {
                console.warn('>>>>MEASUREMENT', measurement);
                OHIF.measurements.syncMeasurementAndToolData(measurement);
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
