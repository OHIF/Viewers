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
                OHIF.measurements.syncMeasurementAndToolData(measurement);
            });
        });
    }

    deleteMeasurements(measurementTypeId, toolType, measurementNumber) {
        const collection = this[measurementTypeId];

        const filter = {
            toolType,
            measurementNumber
        };

        // Get the entries information before removing them
        const entries = collection.find(filter).fetch();
        collection.remove(filter);

        // Synchronize the new data with cornerstone tools
        const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;
        _.each(entries, entry => {
            if (toolState[entry.imageId]) {
                const toolData = toolState[entry.imageId][entry.toolType];
                const measurementsData = toolData && toolData.data;
                const measurementEntry = _.findWhere(measurementsData, {
                    _id: entry._id
                });

                if (measurementEntry) {
                    const index = measurementsData.indexOf(measurementEntry);
                    measurementsData.splice(index, 1);
                }
            }
        });

        // Update the measurement numbers for the remaning measurements
        const updateFilter = _.clone(filter);
        updateFilter.measurementNumber = {
            $gt: measurementNumber
        };
        collection.update(updateFilter, {
            $inc: {
                measurementNumber: -1
            }
        }, {
            multi: true
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
