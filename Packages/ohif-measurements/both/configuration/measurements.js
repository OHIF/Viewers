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
            this[measurementTypeId]._debugName = tool.name;
            this[measurementTypeId].attachSchema(tool.schema);
        });
    }

    retrieveMeasurements(patientId, timepointIds) {
        const retrievalFn = configuration.dataExchange.retrieve;
        if (!_.isFunction(retrievalFn)) {
            return;
        }

        return new Promise((resolve, reject) => {
            retrievalFn(patientId, timepointIds).then(measurementData => {

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

    storeMeasurements(timepoints) {
        const storeFn = configuration.dataExchange.store;
        if (!_.isFunction(storeFn)) {
            return;
        }

        let measurementData = {};
        configuration.measurementTools.forEach(tool => {
            const measurementTypeId = tool.id;
            measurementData[measurementTypeId] = this[measurementTypeId].find().fetch();
        });

        const timepointIds = timepoints.map(t => t.timepointId);
        const patientId = timepoints[0].patientId;
        const filter = {
            patientId,
            timepointId: {
                $in: timepointIds
            }
        };

        storeFn(measurementData, filter).then(() => {
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

    // TODO: Create a better function to combine hasDataAtTimepoint and hasNoDataAtTimepoint
    // because this doesn't seem very elegant...
    hasDataAtTimepoint(collection, timepointId) {
        // Retrieve all the data for this Measurement type (e.g. 'targets')
        // which was recorded at baseline.
        const dataAtTimepoint = collection.find({timepointId});

        // Obtain a list of the Measurement Numbers from the
        // measurements which have data at this timepoint
        const numbers = dataAtTimepoint.map(m => m.measurementNumber);

        // Retrieve all the data for this Measurement type which
        // match the Measurement Numbers obtained above
        const filter = {
            measurementNumber: {
                $in: numbers
            }
        };

        return collection.find(filter).fetch();
    }

    hasNoDataAtTimepoint(collection, timepointId) {
        // Retrieve all the data for this Measurement type (e.g. 'targets')
        // which was recorded at baseline.
        const dataAtTimepoint = collection.find({timepointId});

        // Obtain a list of the Measurement Numbers from the
        // measurements which have data at this timepoint
        const numbers = dataAtTimepoint.map(m => m.measurementNumber);

        // Retrieve all the data for this Measurement type which
        // match the Measurement Numbers obtained above
        const filter = {
            measurementNumber: {
                $nin: numbers
            }
        };
        
        return collection.find(filter).fetch();
    }

    sortMeasurements(baselineTimepointId) {
        const tools = configuration.measurementTools;
        const hasDataAtTimepoint = this.hasDataAtTimepoint;
        const hasNoDataAtTimepoint = this.hasNoDataAtTimepoint;

        const includedTools = tools.filter(tool => {
            return (tool.options && tool.options.includeInCaseProgress === true);
        });

        let overallMeasurementNumber = 1;
        let specificToolMeasurementNumber = 1;


        const updateMeasurementNumber = (collection, toolType) => {
            return data => {
                const filter = {
                    measurementNumber: data.measurementNumber,
                    toolType
                }

                collection.update(filter, {
                    $set: {
                        measurementNumber: specificToolMeasurementNumber
                    }
                });

                // Increment the overall measurement number
                specificToolMeasurementNumber += 1;
            };
        };

        const updateMeasurementNumberOverall = (collection, toolType) => {
            return data => {
                const filter = {
                    measurementNumber: data.measurementNumber,
                    toolType
                }

                collection.update(filter, {
                    $set: {
                        measurementNumberOverall: overallMeasurementNumber
                    }
                });

                // Increment the overall measurement number
                overallMeasurementNumber += 1;
            };
        };

        const summarizeMeasurement = (groupObject, toolType) => {
            return key => {
                return {
                    measurementNumber: parseInt(key, 10),
                    entries: groupObject[key],
                    toolType
                };
            };
        };

        // First, update Measurement Number and the displayed Measurements
        includedTools.forEach(tool => {
            const collection = this[tool.id];
            const toolType = tool.cornerstoneToolType;
            const measurements = collection.find({toolType}).fetch();
            const groupObject = _.groupBy(measurements, m => m.measurementNumber);
            const sortedByMeasurementNumber = Object.keys(groupObject).map(summarizeMeasurement(groupObject, toolType));
            sortedByMeasurementNumber.forEach(updateMeasurementNumber(collection, toolType))

            measurements.forEach(measurement => {
                OHIF.measurements.syncMeasurementAndToolData(measurement);
            });

            // Reset specificToolMeasurementNumber
            specificToolMeasurementNumber = 1;
        });

        // Next, handle the overall measurement number.
        // First, handle data that has a measurement at baseline
        includedTools.forEach(tool => {
            const collection = this[tool.id];
            const toolType = tool.cornerstoneToolType;
            const measurements = hasDataAtTimepoint(collection, baselineTimepointId);
            const groupObject = _.groupBy(measurements, m => m.measurementNumber);
            const sortedByMeasurementNumber = Object.keys(groupObject).map(summarizeMeasurement(groupObject, toolType));
            sortedByMeasurementNumber.forEach(updateMeasurementNumberOverall(collection, toolType))
        });

        // Next, handle New Measurements (i.e. no baseline data)
        // Note that this cannot be combined with the loop above due to the incrementing of the overallMeasurementNumber
        includedTools.forEach(tool => { 
            const collection = this[tool.id];
            const toolType = tool.cornerstoneToolType;
            const measurements = hasNoDataAtTimepoint(collection, baselineTimepointId);
            const groupObject = _.groupBy(measurements, m => m.measurementNumber);
            const sortedByMeasurementNumber = Object.keys(groupObject).map(summarizeMeasurement(groupObject, toolType));
            sortedByMeasurementNumber.forEach(updateMeasurementNumberOverall(collection, toolType));
        });
    }

    deleteMeasurements(measurementTypeId, filter) {
        const collection = this[measurementTypeId];

        // Get the entries information before removing them
        const entries = collection.find(filter).fetch();
        collection.remove(filter);

        // Stop here if no entries were found
        if (!entries.length) {
            return;
        }

        // If the filter doesn't have the measurement number, get it from the first entry
        const measurementNumber = filter.measurementNumber || entries[0].measurementNumber;

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

        // Update the measurement numbers for the remaining measurements
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

        // Synchronize the updated measurements with Cornerstone Tools
        // toolData to make sure the displayed measurements show 'Target X' correctly
        const syncFilter = _.clone(updateFilter);
        syncFilter.measurementNumber = {
            $gt: measurementNumber - 1
        };

        collection.find(syncFilter).forEach(measurement => {
            OHIF.measurements.syncMeasurementAndToolData(measurement);
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
