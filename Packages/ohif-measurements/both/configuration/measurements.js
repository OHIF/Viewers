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

    constructor(timepointApi) {
        if (timepointApi) {
            this.timepointApi = timepointApi;
        }

        this.toolGroups = {};
        this.tools = {};
        this.toolsGroupsMap = {};

        configuration.measurementTools.forEach(toolGroup => {
            const groupCollection = new Mongo.Collection(null);
            groupCollection._debugName = toolGroup.name;
            groupCollection.attachSchema(toolGroup.schema);
            this.toolGroups[toolGroup.id] = groupCollection;

            toolGroup.childTools.forEach(tool => {
                const collection = new Mongo.Collection(null);
                collection._debugName = tool.name;
                collection.attachSchema(tool.schema);
                this.tools[tool.id] = collection;
                this.toolsGroupsMap[tool.id] = toolGroup.id;

                const addedHandler = measurement => {
                    // Get the measurement number
                    const timepoint = this.timepointApi.timepoints.findOne({
                        studyInstanceUids: measurement.studyInstanceUid
                    });
                    const measurementNumber = groupCollection.find({
                        studyInstanceUid: { $in: timepoint.studyInstanceUids }
                    }).count() + 1;
                    measurement.measurementNumber = measurementNumber;

                    // Get the current location (if already defined)
                    let location;
                    const baselineTimepoint = timepointApi.baseline();
                    const baselineGroupEntry = groupCollection.findOne({
                        timepointId: baselineTimepoint.timepointId
                    });
                    if (baselineGroupEntry) {
                        const tool = this.tools[baselineGroupEntry.toolId];
                        const found = tool.findOne({ measurementNumber });
                        if (found) {
                            location = found.location;
                        }
                    }

                    // Reflect the entry in the tool group collection
                    groupCollection.insert({
                        toolId: tool.id,
                        toolItemId: measurement._id,
                        timepointId: timepoint.timepointId,
                        studyInstanceUid: measurement.studyInstanceUid,
                        createdAt: measurement.createdAt,
                        measurementNumber
                    });

                    // Set the timepoint ID, measurement number and location
                    collection.update(measurement._id, {
                        $set: {
                            timepointId: timepoint.timepointId,
                            measurementNumber,
                            location
                        }
                    });
                };

                const removedHandler = measurement => {
                    // Remove the record from the tools group collection too
                    groupCollection.remove({
                        toolItemId: measurement._id
                    });

                    // Update the measurement numbers only if it is last item
                    const measurementNumber = measurement.measurementNumber;
                    const timepoint = this.timepointApi.timepoints.findOne({
                        timepointId: measurement.timepointId
                    });
                    const filter = {
                        studyInstanceUid: { $in: timepoint.studyInstanceUids },
                        measurementNumber
                    };
                    const remainingItems = groupCollection.find(filter).count();
                    if (!remainingItems) {
                        filter.measurementNumber = { $gte: measurementNumber };
                        const operator = {
                            $inc: { measurementNumber: -1 }
                        };
                        const options = { multi: true };
                        groupCollection.update(filter, operator, options);
                        toolGroup.childTools.forEach(childTool => {
                            const collection = this.tools[childTool.id];
                            collection.update(filter, operator, options);
                        });
                    }
                };

                collection.find().observe({
                    added: addedHandler,
                    removed: removedHandler
                });
            });
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
                        this.tools[measurement.toolType].insert(measurement);
                    });
                });

                resolve();
            });
        });
    }

    storeMeasurements() {
        const storeFn = configuration.dataExchange.store;
        if (!_.isFunction(storeFn)) {
            return;
        }

        let measurementData = {};
        configuration.measurementTools.forEach(toolGroup => {
            toolGroup.childTools.forEach(tool => {
                if (!measurementData[toolGroup.id]) {
                    measurementData[toolGroup.id] = [];
                }

                measurementData[toolGroup.id] = measurementData[toolGroup.id].concat(this.tools[tool.id].find().fetch());
            });
        });

        const timepoints = this.timepointApi.all();
        const timepointIds = timepoints.map(t => t.timepointId);
        const patientId = timepoints[0].patientId;
        const filter = {
            patientId,
            timepointId: {
                $in: timepointIds
            }
        };

        OHIF.log.info('Saving Measurements for timepoints:', timepoints);
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
        configuration.measurementTools.forEach(toolGroup => {
            toolGroup.childTools.forEach(tool => {
                const measurements = this.tools[tool.id].find().fetch();
                measurements.forEach(measurement => {
                    OHIF.measurements.syncMeasurementAndToolData(measurement);
                });
            });
        });
    }

    sortMeasurements(baselineTimepointId) {
        const tools = configuration.measurementTools;

        const includedTools = tools.filter(tool => {
            return (tool.options && tool.options.caseProgress && tool.options.caseProgress.include);
        });

        // Update Measurement the displayed Measurements
        includedTools.forEach(tool => {
            const collection = this.tools[tool.id];
            const measurements = collection.find().fetch();
            measurements.forEach(measurement => {
                OHIF.measurements.syncMeasurementAndToolData(measurement);
            });
        });
    }

    deleteMeasurements(measurementTypeId, filter) {
        const groupCollection = this.toolGroups[measurementTypeId];

        // Get the entries information before removing them
        const groupItems = groupCollection.find(filter).fetch();
        const entries = [];
        groupItems.forEach(groupItem => {
            const collection = this.tools[groupItem.toolId];
            entries.push(collection.findOne(groupItem.toolItemId));
            collection.remove(groupItem.toolItemId);
        });

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

        // Synchronize the updated measurements with Cornerstone Tools
        // toolData to make sure the displayed measurements show 'Target X' correctly
        const syncFilter = _.clone(filter);
        syncFilter.measurementNumber = {
            $gt: measurementNumber - 1
        };

        const toolTypes = _.uniq(entries.map(entry => entry.toolType));
        toolTypes.forEach(toolType => {
            const collection = this.tools[toolType];
            collection.find(syncFilter).forEach(measurement => {
                OHIF.measurements.syncMeasurementAndToolData(measurement);
            });
        });
    }

    fetch(measurementTypeId, selector, options) {
        if (!this.toolGroups[measurementTypeId]) {
            throw 'MeasurementApi: No Collection with the id: ' + measurementTypeId;
        }

        selector = selector || {};
        options = options || {};
        const result = [];
        const items = this.toolGroups[measurementTypeId].find(selector, options).fetch();
        items.forEach(item => {
            result.push(this.tools[item.toolId].findOne(item.toolItemId));
        });
        return result;
    }
}

OHIF.measurements.MeasurementApi = MeasurementApi;
