import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';

let configuration = {};

class MeasurementApi {
    static setConfiguration(config) {
        _.extend(configuration, config);
    }

    static getConfiguration() {
        return configuration;
    }

    static getToolsGroupsMap() {
        const toolsGroupsMap = {};
        configuration.measurementTools.forEach(toolGroup => {
            toolGroup.childTools.forEach(tool => (toolsGroupsMap[tool.id] = toolGroup.id));
        });
        return toolsGroupsMap;
    }

    constructor(timepointApi) {
        if (timepointApi) {
            this.timepointApi = timepointApi;
        }

        this.toolGroups = {};
        this.tools = {};
        this.toolsGroupsMap = MeasurementApi.getToolsGroupsMap();
        this.changeObserver = new Tracker.Dependency();

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

                const addedHandler = measurement => {
                    let measurementNumber;

                    // Get the measurement number
                    const timepoint = this.timepointApi.timepoints.findOne({
                        studyInstanceUids: measurement.studyInstanceUid
                    });

                    // Preventing errors thrown when non-associated (standalone) study is opened...
                    // @TODO: Make sure this logic is correct.
                    if (!timepoint) return;

                    const emptyItem = groupCollection.findOne({
                        toolId: { $eq: null },
                        timepointId: timepoint.timepointId
                    });

                    if (emptyItem) {
                        measurementNumber = emptyItem.measurementNumber;

                        groupCollection.update({
                            timepointId: timepoint.timepointId,
                            measurementNumber
                        }, {
                            $set: {
                                toolId: tool.id,
                                toolItemId: measurement._id,
                                createdAt: measurement.createdAt
                            }
                        });
                    } else {
                        measurementNumber = groupCollection.find({
                            studyInstanceUid: { $in: timepoint.studyInstanceUids }
                        }).count() + 1;
                    }

                    measurement.measurementNumber = measurementNumber;

                    // Get the current location/description (if already defined)
                    const updateObject = {
                        timepointId: timepoint.timepointId,
                        measurementNumber
                    };
                    const baselineTimepoint = timepointApi.baseline();
                    const baselineGroupEntry = groupCollection.findOne({
                        timepointId: baselineTimepoint.timepointId
                    });
                    if (baselineGroupEntry) {
                        const tool = this.tools[baselineGroupEntry.toolId];
                        const found = tool.findOne({ measurementNumber });
                        if (found) {
                            updateObject.location = found.location;
                            if (found.description) {
                                updateObject.description = found.description;
                            }
                        }
                    }

                    // Set the timepoint ID, measurement number, location and description
                    collection.update(measurement._id, { $set: updateObject });

                    if (!emptyItem) {
                        // Reflect the entry in the tool group collection
                        groupCollection.insert({
                            toolId: tool.id,
                            toolItemId: measurement._id,
                            timepointId: timepoint.timepointId,
                            studyInstanceUid: measurement.studyInstanceUid,
                            createdAt: measurement.createdAt,
                            measurementNumber
                        });
                    }

                    // Enable reactivity
                    this.changeObserver.changed();
                };

                const changedHandler = measurement => {
                    this.changeObserver.changed();
                };

                const removedHandler = measurement => {
                    const measurementNumber = measurement.measurementNumber;

                    groupCollection.update({
                        toolItemId: measurement._id
                    }, {
                        $set: {
                            toolId: null,
                            toolItemId: null
                        }
                    });

                    const nonEmptyItem = groupCollection.findOne({
                        measurementNumber,
                        toolId: { $not: null }
                    });

                    if (nonEmptyItem) {
                        return;
                    }

                    const groupItems = groupCollection.find({ measurementNumber }).fetch();

                    groupItems.forEach(groupItem => {
                        // Remove the record from the tools group collection too
                        groupCollection.remove({ _id: groupItem._id });

                        // Update the measurement numbers only if it is last item
                        const timepoint = this.timepointApi.timepoints.findOne({
                            timepointId: groupItem.timepointId
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
                    });

                    // Synchronize the new tool data
                    this.syncMeasurementsAndToolData();

                    // Enable reactivity
                    this.changeObserver.changed();
                };

                collection.find().observe({
                    added: addedHandler,
                    changed: changedHandler,
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

                const toolsGroupsMap = MeasurementApi.getToolsGroupsMap();
                const measurementsGroups = {};

                Object.keys(measurementData).forEach(measurementTypeId => {
                    const measurements = measurementData[measurementTypeId];

                    measurements.forEach(measurement => {
                        const { toolType } = measurement;
                        if (toolType && this.tools[toolType]) {
                            delete measurement._id;
                            const toolGroup = toolsGroupsMap[toolType];
                            if (!measurementsGroups[toolGroup]) {
                                measurementsGroups[toolGroup] = [];
                            }

                            measurementsGroups[toolGroup].push(measurement);
                        }
                    });
                });

                Object.keys(measurementsGroups).forEach(groupKey => {
                    const group = measurementsGroups[groupKey];
                    group.sort((a, b) => {
                        if (a.measurementNumber > b.measurementNumber) {
                            return 1;
                        } else if (a.measurementNumber < b.measurementNumber) {
                            return -1;
                        }

                        return 0;
                    });

                    group.forEach(m => this.tools[m.toolType].insert(m));
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
        configuration.measurementTools.forEach(toolGroup => {
            toolGroup.childTools.forEach(tool => {
                if (!measurementData[toolGroup.id]) {
                    measurementData[toolGroup.id] = [];
                }

                measurementData[toolGroup.id] = measurementData[toolGroup.id].concat(this.tools[tool.id].find().fetch());
            });
        });

        const timepointFilter = timepointId ? { timepointId } : {};
        const timepoints = this.timepointApi.all(timepointFilter);
        const timepointIds = timepoints.map(t => t.timepointId);
        const patientId = timepoints[0].patientId;
        const filter = {
            patientId,
            timepointId: {
                $in: timepointIds
            }
        };

        OHIF.log.info('Saving Measurements for timepoints:', timepoints);
        return storeFn(measurementData, filter).then(() => {
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

        // Stop here if it is a temporary toolGroups
        if (!groupCollection) return;

        // Get the entries information before removing them
        const groupItems = groupCollection.find(filter).fetch();
        const entries = [];
        groupItems.forEach(groupItem => {
            if (!groupItem.toolId) {
                return;
            }

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
        const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();

        _.each(entries, entry => {
            const measurementsData = [];
            const { tool } = OHIF.measurements.getToolConfiguration(entry.toolType);
            if (Array.isArray(tool.childTools)) {
                tool.childTools.forEach(key => {
                    const childMeasurement = entry[key];
                    if (!childMeasurement) return;
                    measurementsData.push(childMeasurement);
                });
            } else {
                measurementsData.push(entry);
            }

            measurementsData.forEach(measurementData => {
                const { imagePath, toolType } = measurementData;
                const imageId = OHIF.viewerbase.getImageIdForImagePath(imagePath);
                if (toolState[imageId]) {
                    const toolData = toolState[imageId][toolType];
                    const measurementEntries = toolData && toolData.data;
                    const measurementEntry = _.findWhere(measurementEntries, { _id: entry._id });
                    if (measurementEntry) {
                        const index = measurementEntries.indexOf(measurementEntry);
                        measurementEntries.splice(index, 1);
                    }
                }
            });
        });

        cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(toolState);

        // Synchronize the updated measurements with Cornerstone Tools
        // toolData to make sure the displayed measurements show 'Target X' correctly
        const syncFilter = _.clone(filter);
        delete syncFilter.timepointId;

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

    getMeasurementById(measurementId) {
        let foundGroup;
        _.find(this.toolGroups, toolGroup => {
            foundGroup = toolGroup.findOne({ toolItemId: measurementId });
            return !!foundGroup;
        });

        // Stop here if no group was found or if the record is a placeholder
        if (!foundGroup || !foundGroup.toolId) {
            return;
        }

        return this.tools[foundGroup.toolId].findOne(measurementId);
    }

    fetch(toolGroupId, selector, options) {
        if (!this.toolGroups[toolGroupId]) {
            throw 'MeasurementApi: No Collection with the id: ' + toolGroupId;
        }

        selector = selector || {};
        options = options || {};
        const result = [];
        const items = this.toolGroups[toolGroupId].find(selector, options).fetch();
        items.forEach(item => {
            if (item.toolId) {
                result.push(this.tools[item.toolId].findOne(item.toolItemId));
            } else {
                result.push({ measurementNumber: item.measurementNumber });
            }

        });
        return result;
    }
}

OHIF.measurements.MeasurementApi = MeasurementApi;
