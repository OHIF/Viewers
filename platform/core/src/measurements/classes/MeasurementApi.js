import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import log from '../../log';
import getLabel from '../lib/getLabel';
import getDescription from '../lib/getDescription';
import getImageIdForImagePath from '../lib/getImageIdForImagePath';
import guid from '../../utils/guid';
import studyMetadataManager from '../../utils/studyMetadataManager';
import { measurementApiDefaultConfig } from './../configuration.js';

const configuration = {
  ...measurementApiDefaultConfig,
};

export default class MeasurementApi {
  static Instance;

  /**
   * Set configuration: It should merge default configuration with any new one
   *
   * @static
   * @param {Object} config
   * @param {Object} config.server
   * @param {string} config.server.type - The server type
   * @param {string} config.server.wadoRoot - The server wado URL root
   * @param {Array} config.measurementTools
   * @param {string} config.measurementTools[].id - The tool group id
   * @param {string} config.measurementTools[].name - The tool group name
   * @param {Array} config.measurementTools[].childTools - The child tool's configuration
   * @param {Object} config.dataExchange
   * @param {Function} config.dataExchange.store - Function that store measurement data
   * @param {Function} config.dataExchange.retrieve - Function that retrieves measurement data
   *
   * @memberof MeasurementApi
   */
  static setConfiguration(config) {
    Object.assign(configuration, config);
  }

  static getConfiguration() {
    return configuration;
  }

  static getToolsGroupsMap() {
    const toolsGroupsMap = {};
    configuration.measurementTools.forEach(toolGroup => {
      toolGroup.childTools.forEach(
        tool => (toolsGroupsMap[tool.id] = toolGroup.id)
      );
    });

    return toolsGroupsMap;
  }

  static getToolGroupTools(toolsGroupsMap) {
    const result = {};
    Object.keys(toolsGroupsMap).forEach(toolType => {
      const toolGroupId = toolsGroupsMap[toolType];
      if (!result[toolGroupId]) {
        result[toolGroupId] = [];
      }

      result[toolGroupId].push(toolType);
    });

    return result;
  }

  static getToolConfiguration(toolType) {
    const configuration = MeasurementApi.getConfiguration();
    const toolsGroupsMap = MeasurementApi.getToolsGroupsMap();

    const toolGroupId = toolsGroupsMap[toolType];
    const toolGroup = configuration.measurementTools.find(
      toolGroup => toolGroup.id === toolGroupId
    );

    let tool;
    if (toolGroup) {
      tool = toolGroup.childTools.find(tool => tool.id === toolType);
    }

    return {
      toolGroupId,
      toolGroup,
      tool,
    };
  }

  static syncMeasurementAndToolData(measurement) {
    log.info('syncMeasurementAndToolData');

    const measurementLabel = getLabel(measurement);
    if (measurementLabel) {
      measurement.labels = [measurementLabel];
    }

    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();

    // Stop here if the metadata for the measurement's study is not loaded yet
    const { StudyInstanceUID } = measurement;
    const metadata = studyMetadataManager.get(StudyInstanceUID);
    if (!metadata) return;

    // Iterate each child tool if the current tool has children
    const toolType = measurement.toolType;
    const { tool } = MeasurementApi.getToolConfiguration(toolType);
    if (Array.isArray(tool.childTools)) {
      tool.childTools.forEach(childToolKey => {
        const childMeasurement = measurement[childToolKey];
        if (!childMeasurement) return;
        childMeasurement._id = measurement._id;
        childMeasurement.measurementNumber = measurement.measurementNumber;
        childMeasurement.lesionNamingNumber = measurement.lesionNamingNumber;

        MeasurementApi.syncMeasurementAndToolData(childMeasurement);
      });

      return;
    }

    const imageId = getImageIdForImagePath(measurement.imagePath);

    // If no tool state exists for this imageId, create an empty object to store it
    if (!toolState[imageId]) {
      toolState[imageId] = {};
    }

    const currentToolState = toolState[imageId][toolType];
    const toolData = currentToolState && currentToolState.data;

    // Check if we already have toolData for this imageId and toolType
    if (toolData && toolData.length) {
      // If we have toolData, we should search it for any data related to the current Measurement
      const toolData = toolState[imageId][toolType].data;

      // Create a flag so we know if we've successfully updated the Measurement in the toolData
      let alreadyExists = false;

      // Loop through the toolData to search for this Measurement
      toolData.forEach(tool => {
        // Break the loop if this isn't the Measurement we are looking for
        if (tool._id !== measurement._id) {
          return;
        }

        // If we have found the Measurement, set the flag to True
        alreadyExists = true;

        // Update the toolData from the Measurement data
        Object.assign(tool, measurement);
        return false;
      });

      // If we have found the Measurement we intended to update, we can stop this function here
      if (alreadyExists === true) {
        return;
      }
    } else {
      // If no toolData exists for this toolType, create an empty array to hold some
      toolState[imageId][toolType] = {
        data: [],
      };
    }

    // If we have reached this point, it means we haven't found the Measurement we are looking for
    // in the current toolData. This means we need to add it.

    // Add the MeasurementData into the toolData for this imageId
    toolState[imageId][toolType].data.push(measurement);

    cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(
      toolState
    );
  }

  static isToolIncluded(tool) {
    return (
      tool.options &&
      tool.options.caseProgress &&
      tool.options.caseProgress.include
    );
  }

  constructor(timepointApi, options = {}) {
    if (MeasurementApi.Instance) {
      MeasurementApi.Instance.initialize(timepointApi, options);
      return MeasurementApi.Instance;
    }

    this.initialize(timepointApi, options);
    MeasurementApi.Instance = this;
  }

  initialize(timepointApi, options = {}) {
    this.timepointApi = timepointApi;
    this.options = options;
    this.toolGroups = {};
    this.tools = {};
    this.toolsGroupsMap = MeasurementApi.getToolsGroupsMap();
    this.toolGroupTools = MeasurementApi.getToolGroupTools(this.toolsGroupsMap);

    // Iterate over each tool group and create collection
    configuration.measurementTools.forEach(toolGroup => {
      this.toolGroups[toolGroup.id] = [];

      // Iterate over each tool group child tools (e.g. bidirectional, targetCR, etc.) and create collection
      toolGroup.childTools.forEach(tool => {
        this.tools[tool.id] = [];
      });
    });
  }

  onMeasurementsUpdated() {
    if (typeof this.options.onMeasurementsUpdated !== 'function') {
      log.warn('Measurements update callback is not defined');
      return;
    }

    this.options.onMeasurementsUpdated(Object.assign({}, this.tools));
  }

  retrieveMeasurements(PatientID, timepointIds) {
    const retrievalFn = configuration.dataExchange.retrieve;
    const { server } = configuration;
    if (typeof retrievalFn !== 'function') {
      log.error('Measurement retrieval function has not been configured.');
      return;
    }

    return new Promise((resolve, reject) => {
      retrievalFn(server).then(measurementData => {
        if (measurementData) {
          log.info('Measurement data retrieval');
          log.info(measurementData);

          Object.keys(measurementData).forEach(measurementTypeId => {
            const measurements = measurementData[measurementTypeId];

            measurements.forEach(measurement => {
              const { toolType } = measurement;

              this.addMeasurement(toolType, measurement);
            });
          });
        }

        resolve();

        // Synchronize the new tool data
        this.syncMeasurementsAndToolData();

        cornerstone.getEnabledElements().forEach(enabledElement => {
          if (enabledElement.image) {
            cornerstone.updateImage(enabledElement.element);
          }
        });

        // Let others know that the measurements are updated
        this.onMeasurementsUpdated();
      }, reject);
    });
  }

  storeMeasurements(timepointId) {
    const { server } = configuration;
    const storeFn = configuration.dataExchange.store;
    if (typeof storeFn !== 'function') {
      log.error('Measurement store function has not been configured.');
      return;
    }

    let measurementData = {};
    configuration.measurementTools.forEach(toolGroup => {
      // Skip the tool groups excluded from case progress
      if (!MeasurementApi.isToolIncluded(toolGroup)) {
        return;
      }

      toolGroup.childTools.forEach(tool => {
        // Skip the tools excluded from case progress
        if (!MeasurementApi.isToolIncluded(tool)) {
          return;
        }

        if (!measurementData[toolGroup.id]) {
          measurementData[toolGroup.id] = [];
        }

        measurementData[toolGroup.id] = measurementData[toolGroup.id].concat(
          this.tools[tool.id]
        );
      });
    });

    const timepointFilter = timepointId
      ? tp => tp.timepointId === timepointId
      : null;
    const timepoints = this.timepointApi.all(timepointFilter);
    const timepointIds = timepoints.map(t => t.timepointId);
    const PatientID = timepoints[0].PatientID;
    const filter = {
      PatientID,
      timepointIds,
    };

    log.info('Saving Measurements for timepoints:', timepoints);
    return storeFn(measurementData, filter, server).then(result => {
      log.info('Measurement storage completed');
      return result;
    });
  }

  calculateLesionNamingNumber(measurements) {
    const sortedMeasurements = measurements.sort((a, b) => {
      if (a.lesionNamingNumber > b.lesionNamingNumber) {
        return 1;
      } else if (a.lesionNamingNumber < b.lesionNamingNumber) {
        return -1;
      }

      return 0;
    });

    //  Calculate lesion naming number starting from 1 not to miss any measurement (as seen in MM)
    //      A measurement from beginning of the list might be deleted, so a new measurement should replace that
    let i;
    for (i = 1; i < sortedMeasurements.length + 1; i++) {
      if (i < sortedMeasurements[i - 1].lesionNamingNumber) {
        break;
      }
    }

    return i;
  }

  fetch(toolGroupId, filter) {
    if (!this.toolGroups[toolGroupId]) {
      throw new Error(
        `MeasurementApi: No Collection with the id: ${toolGroupId}`
      );
    }

    let items;
    if (filter) {
      items = this.toolGroups[toolGroupId].filter(filter);
    } else {
      items = this.toolGroups[toolGroupId];
    }

    return items.map(item => {
      if (item.toolId) {
        return this.tools[item.toolId].find(
          tool => tool._id === item.toolItemId
        );
      }

      return { lesionNamingNumber: item.lesionNamingNumber };
    });
  }

  getFirstMeasurement(timepointId) {
    // Get child tools from all included tool groups
    let childTools = [];
    configuration.measurementTools.forEach(toolGroup => {
      // Skip the tool groups excluded from case progress
      if (!MeasurementApi.isToolIncluded(toolGroup)) {
        return false;
      }

      childTools = childTools.concat(toolGroup.childTools);
    });

    // Get all included child tools
    const includedChildTools = childTools.filter(tool =>
      MeasurementApi.isToolIncluded(tool)
    );

    // Get the first measurement for the given timepoint
    let measurement = undefined;
    includedChildTools.every(tool => {
      measurement = this.tools[tool.id].find(
        t => t.timepointId === timepointId && t.measurementNumber === 1
      );

      return !measurement;
    });

    // Return the found measurement object or undefined if not found
    return measurement;
  }

  lesionExistsAtTimepoints(lesionNamingNumber, toolGroupId, timepointIds) {
    // Retrieve all the data for the given tool group (e.g. 'targets')
    const measurementsAtTimepoint = this.fetch(toolGroupId, tool =>
      timepointIds.includes(tool.timepointId)
    );

    // Return whether or not any lesion at this timepoint has the same lesionNamingNumber
    return !!measurementsAtTimepoint.find(
      m => m.lesionNamingNumber === lesionNamingNumber
    );
  }

  isNewLesionsMeasurement(measurementData) {
    if (!measurementData) {
      return;
    }

    const toolConfig = MeasurementApi.getToolConfiguration(
      measurementData.toolType
    );
    const toolType = toolConfig.tool.parentTool || measurementData.toolType;
    const { timepointApi } = this;
    const currentMeasurement =
      this.tools[toolType].find(tool => tool._id === measurementData._id) || {};
    const timepointId =
      currentMeasurement.timepointId || measurementData.timepointId;
    const lesionNamingNumber =
      currentMeasurement.lesionNamingNumber ||
      measurementData.lesionNamingNumber;

    // Stop here if the needed information is not set
    if (!timepointApi || !timepointId || !toolConfig) {
      return;
    }

    const { toolGroupId } = toolConfig;
    const current = timepointApi.timepoints.find(
      tp => tp.timepointId === timepointId
    );
    const initialTimepointIds = timepointApi.initialTimepointIds();

    // Stop here if there's no initial timepoint, or if the current is any initial
    if (
      !initialTimepointIds ||
      initialTimepointIds.length < 1 ||
      initialTimepointIds.some(
        initialtpid => initialtpid === current.timepointId
      )
    ) {
      return false;
    }

    return (
      this.lesionExistsAtTimepoints(
        lesionNamingNumber,
        toolGroupId,
        initialTimepointIds
      ) === false
    );
  }

  calculateLesionMaxMeasurementNumber(groupId, filter) {
    let measurements = [];
    if (groupId) {
      // Get the measurements of the group
      measurements = this.toolGroups[groupId] || [];
    } else {
      // Get all measurements of all groups
      measurements = Object.keys(this.toolGroups).reduce((acc, val) => {
        acc.push(...this.toolGroups[val]);
        return acc;
      }, []);
    }

    const sortedMeasurements = measurements.filter(filter).sort((tp1, tp2) => {
      return tp1.measurementNumber < tp2.measurementNumber ? 1 : -1;
    });

    for (let i = 0; i < sortedMeasurements.length; i++) {
      const toolGroupMeasurement = sortedMeasurements[i];
      const measurement = this.tools[toolGroupMeasurement.toolId].find(
        tool => tool._id === toolGroupMeasurement.toolItemId
      );
      const isNew = this.isNewLesionsMeasurement(measurement);
      if (!isNew) {
        return measurement.measurementNumber;
      }
    }

    return 0;
  }

  calculateNewLesionMaxMeasurementNumber(groupId, filter) {
    const sortedMeasurements = this.toolGroups[groupId]
      .filter(filter)
      .sort((tp1, tp2) => {
        return tp1.measurementNumber < tp2.measurementNumber ? 1 : -1;
      });

    for (let i = 0; i < sortedMeasurements.length; i++) {
      const toolGroupMeasurement = sortedMeasurements[i];
      const measurement = this.tools[toolGroupMeasurement.toolId].find(
        tool => tool._id === toolGroupMeasurement.toolItemId
      );
      const isNew = this.isNewLesionsMeasurement(measurement);
      if (isNew) {
        return measurement.measurementNumber;
      }
    }

    return 0;
  }

  calculateMeasurementNumber(measurement) {
    const toolGroupId = this.toolsGroupsMap[measurement.toolType];

    const filter = tool => tool._id !== measurement._id;

    const isNew = this.isNewLesionsMeasurement(measurement);

    if (isNew) {
      const maxTargetMeasurementNumber = this.calculateLesionMaxMeasurementNumber(
        'targets',
        filter
      );
      const maxNonTargetMeasurementNumber = this.calculateLesionMaxMeasurementNumber(
        'nonTargets',
        filter
      );
      const maxNewTargetMeasurementNumber = this.calculateNewLesionMaxMeasurementNumber(
        'targets',
        filter
      );
      if (toolGroupId === 'targets') {
        return Math.max(
          maxTargetMeasurementNumber,
          maxNonTargetMeasurementNumber,
          maxNewTargetMeasurementNumber
        );
      } else if (toolGroupId === 'nonTargets') {
        const maxNewNonTargetMeasurementNumber = this.calculateNewLesionMaxMeasurementNumber(
          'nonTargets',
          filter
        );
        return Math.max(
          maxTargetMeasurementNumber,
          maxNonTargetMeasurementNumber,
          maxNewTargetMeasurementNumber,
          maxNewNonTargetMeasurementNumber
        );
      }
    } else {
      const maxTargetMeasurementNumber = this.calculateLesionMaxMeasurementNumber(
        'targets',
        filter
      );
      if (toolGroupId === 'targets') {
        return maxTargetMeasurementNumber;
      } else if (toolGroupId === 'nonTargets') {
        const maxNonTargetMeasurementNumber = this.calculateLesionMaxMeasurementNumber(
          'nonTargets',
          filter
        );
        return Math.max(
          maxTargetMeasurementNumber,
          maxNonTargetMeasurementNumber
        );
      } else {
        return this.calculateLesionMaxMeasurementNumber(null, filter);
      }
    }

    return 0;
  }

  getPreviousMeasurement(measurementData) {
    if (!measurementData) {
      return;
    }

    const { timepointId, toolType, lesionNamingNumber } = measurementData;
    if (!timepointId || !toolType || !lesionNamingNumber) {
      return;
    }

    const toolGroupId = this.toolsGroupsMap[measurementData.toolType];

    // TODO: Remove TrialPatientLocationUID from here and override it somehow
    // by dependant applications. Here we should use the location attribute instead of the uid
    let filter;
    const uid =
      measurementData.additionalData &&
      measurementData.additionalData.TrialPatientLocationUID;
    if (uid) {
      filter = tool =>
        tool._id !== measurementData._id &&
        tool.additionalData &&
        tool.additionalData.TrialPatientLocationUID === uid;
    } else {
      filter = tool =>
        tool._id !== measurementData._id &&
        tool.lesionNamingNumber === lesionNamingNumber;
    }

    const childToolTypes = this.toolGroupTools[toolGroupId];
    for (let i = 0; i < childToolTypes.length; i++) {
      const childToolType = childToolTypes[i];
      const toolCollection = this.tools[childToolType];
      const item = toolCollection.find(filter);

      if (item) {
        return item;
      }
    }
  }

  hasDuplicateMeasurementNumber(measurementData) {
    if (!measurementData) {
      return;
    }

    const { toolType, measurementNumber } = measurementData;
    if (!toolType || !measurementNumber) {
      return;
    }

    const filter = tool =>
      tool._id !== measurementData._id &&
      tool.measurementNumber === measurementData.measurementNumber;

    return configuration.measurementTools
      .filter(toolGroup => toolGroup.id !== 'temp')
      .some(toolGroup => {
        if (this.toolGroups[toolGroup.id].find(filter)) {
          return true;
        }
        return toolGroup.childTools.some(tool => {
          if (this.tools[tool.id].find(filter)) {
            return true;
          }
        });
      });
  }

  updateNumbering(collectionToUpdate, propertyFilter, propertyName, increment) {
    collectionToUpdate.filter(propertyFilter).forEach(item => {
      item[propertyName] += increment;
    });
  }

  updateMeasurementNumberForAllMeasurements(measurement, increment) {
    const filter = tool =>
      tool._id !== measurement._id &&
      tool.measurementNumber >= measurement.measurementNumber;

    configuration.measurementTools
      .filter(toolGroup => toolGroup.id !== 'temp')
      .forEach(toolGroup => {
        this.updateNumbering(
          this.toolGroups[toolGroup.id],
          filter,
          'measurementNumber',
          increment
        );

        toolGroup.childTools.forEach(tool => {
          this.updateNumbering(
            this.tools[tool.id],
            filter,
            'measurementNumber',
            increment
          );
        });
      });
  }

  addMeasurement(toolType, measurement) {
    const toolGroup = this.toolsGroupsMap[toolType];
    const groupCollection = this.toolGroups[toolGroup];
    const collection = this.tools[toolType];

    // Get the related measurement by the measurement number and use its location if defined
    const relatedMeasurement = collection.find(
      t =>
        t.lesionNamingNumber === measurement.lesionNamingNumber &&
        t.toolType === measurement.toolType
    );

    // Use the related measurement location if found and defined
    if (relatedMeasurement && relatedMeasurement.location) {
      measurement.location = relatedMeasurement.location;
    }

    // Use the related measurement description if found and defined
    if (relatedMeasurement && relatedMeasurement.description) {
      measurement.description = relatedMeasurement.description;
    }

    measurement._id = guid();

    // Get the timepoint
    let timepoint;
    if (measurement.StudyInstanceUID) {
      timepoint = this.timepointApi.study(measurement.StudyInstanceUID)[0];
    } else {
      const { timepointId } = measurement;
      timepoint = this.timepointApi.timepoints.find(
        t => t.timepointId === timepointId
      );
    }

    // Preventing errors thrown when non-associated (standalone) study is opened...
    // @TODO: Make sure this logic is correct.
    if (!timepoint) return;

    // Empty Item is the lesion just added in cornerstoneTools, but does not have measurement data yet
    const emptyItem = groupCollection.find(
      groupTool =>
        !groupTool.toolId && groupTool.timepointId === timepoint.timepointId
    );

    // Set the timepointId attribute to measurement to make it easier to filter measurements by timepoint
    measurement.timepointId = timepoint.timepointId;

    // Check if the measurement data is just added by a cornerstone tool and is still empty
    if (emptyItem) {
      // Set relevant initial data and measurement number to the measurement
      measurement.lesionNamingNumber = emptyItem.lesionNamingNumber;
      measurement.measurementNumber = emptyItem.measurementNumber;

      groupCollection
        .filter(
          groupTool =>
            groupTool.timepointId === timepoint.timepointId &&
            groupTool.lesionNamingNumber === measurement.lesionNamingNumber
        )
        .forEach(groupTool => {
          groupTool.toolId = tool.id;
          groupTool.toolItemId = measurement._id;
          groupTool.createdAt = measurement.createdAt;
          groupTool.measurementNumber = measurement.measurementNumber;
        });
    } else {
      // Handle measurements not added by cornerstone tools and update its number
      const measurementsInTimepoint = groupCollection.filter(
        groupTool => groupTool.timepointId === timepoint.timepointId
      );
      measurement.lesionNamingNumber = this.calculateLesionNamingNumber(
        measurementsInTimepoint
      );
      measurement.measurementNumber =
        measurement.measurementNumber ||
        this.calculateMeasurementNumber(measurement) + 1;
    }

    // Define an update object to reflect the changes in the collection
    const updateObject = {
      timepointId: timepoint.timepointId,
      lesionNamingNumber: measurement.lesionNamingNumber,
      measurementNumber: measurement.measurementNumber,
    };

    // Find the matched measurement from other timepoints
    const found = this.getPreviousMeasurement(measurement);

    // Check if a previous related meausurement was found on other timepoints
    if (found) {
      // Use the same number as the previous measurement
      measurement.lesionNamingNumber = found.lesionNamingNumber;
      measurement.measurementNumber = found.measurementNumber;

      // TODO: Remove TrialPatientLocationUID from here and override it somehow
      // by dependant applications

      // Change the update object to set the same number, additionalData,
      // location, label and description to the current measurement
      updateObject.lesionNamingNumber = found.lesionNamingNumber;
      updateObject.measurementNumber = found.measurementNumber;
      updateObject.additionalData = measurement.additionalData || {};
      updateObject.additionalData.TrialPatientLocationUID =
        found.additionalData && found.additionalData.TrialPatientLocationUID;
      updateObject.location = found.location;
      updateObject.label = found.label;
      updateObject.description = found.description;
      updateObject.isSplitLesion = found.isSplitLesion;
      updateObject.isNodal = found.isNodal;

      const description = getDescription(found, measurement);
      if (description) {
        updateObject.description = description;
      }
    } else if (this.hasDuplicateMeasurementNumber(measurement)) {
      // Update measurementNumber for the measurements with masurementNumber greater or equal than
      //  measurementNumber of the added measurement (except the added one)
      //   only if there is another measurement with the same measurementNumber
      this.updateMeasurementNumberForAllMeasurements(measurement, 1);
    }

    let addedMeasurement;

    // Upsert the measurement in collection
    const toolIndex = collection.findIndex(
      tool => tool._id === measurement._id
    );
    if (toolIndex > -1) {
      addedMeasurement = Object.assign({}, collection[toolIndex], updateObject);
      collection[toolIndex] = addedMeasurement;
    } else {
      addedMeasurement = Object.assign({}, measurement, updateObject);
      collection.push(addedMeasurement);
    }

    if (measurement.isReadOnly) {
      addedMeasurement.isReadOnly = measurement.isReadOnly;
    }

    if (!emptyItem) {
      // Reflect the entry in the tool group collection
      groupCollection.push({
        toolId: toolType,
        toolItemId: addedMeasurement._id,
        timepointId: timepoint.timepointId,
        StudyInstanceUID: addedMeasurement.StudyInstanceUID,
        createdAt: addedMeasurement.createdAt,
        lesionNamingNumber: addedMeasurement.lesionNamingNumber,
        measurementNumber: addedMeasurement.measurementNumber,
      });
    }

    // Let others know that the measurements are updated
    this.onMeasurementsUpdated();

    // TODO: Enable reactivity
    // this.timepointChanged.set(timepoint.timepointId);

    return addedMeasurement;
  }

  updateMeasurement(toolType, measurement) {
    const collection = this.tools[toolType];

    const toolIndex = collection.findIndex(
      tool => tool._id === measurement._id
    );
    if (toolIndex < 0) {
      return;
    }

    collection[toolIndex] = Object.assign({}, measurement);

    // Let others know that the measurements are updated
    this.onMeasurementsUpdated();

    // TODO: Enable reactivity
    // this.timepointChanged.set(timepoint.timepointId);
  }

  onMeasurementRemoved(toolType, measurement) {
    const { lesionNamingNumber, measurementNumber } = measurement;

    const toolGroupId = this.toolsGroupsMap[toolType];
    const groupCollection = this.toolGroups[toolGroupId];

    const groupIndex = groupCollection.findIndex(
      group => group.toolItemId === measurement._id
    );
    if (groupIndex < 0) {
      return;
    }

    //  Remove the deleted measurement only in its timepoint from the collection
    groupCollection.splice(groupIndex, 1);

    //  Check which timepoints have the deleted measurement
    const timepointsWithDeletedMeasurement = groupCollection
      .filter(tool => tool.measurementNumber === measurementNumber)
      .map(tool => tool.timepointId);

    //  Update lesionNamingNumber and measurementNumber only if there is no timepoint with that measurement
    if (timepointsWithDeletedMeasurement.length < 1) {
      //  Decrease lesionNamingNumber of all measurements with lesionNamingNumber greater than lesionNamingNumber of the deleted measurement by 1
      const lesionNamingNumberFilter = tool =>
        tool.lesionNamingNumber >= lesionNamingNumber;
      this.updateNumbering(
        groupCollection,
        lesionNamingNumberFilter,
        'lesionNamingNumber',
        -1
      );

      const toolGroup = configuration.measurementTools.find(
        tGroup => tGroup.id === toolGroupId
      );
      if (toolGroup && toolGroup.childTools) {
        toolGroup.childTools.forEach(childTool => {
          const collection = this.tools[childTool.id];
          this.updateNumbering(
            collection,
            lesionNamingNumberFilter,
            'lesionNamingNumber',
            -1
          );
        });
      }

      //  Decrease measurementNumber of all measurements with measurementNumber greater than measurementNumber of the deleted measurement by 1
      this.updateMeasurementNumberForAllMeasurements(measurement, -1);
    }

    // Synchronize the new tool data
    this.syncMeasurementsAndToolData();

    // Let others know that the measurements are updated
    this.onMeasurementsUpdated();

    // TODO: Enable reactivity
    // this.timepointChanged.set(timepoint.timepointId);
  }

  syncMeasurementsAndToolData() {
    configuration.measurementTools.forEach(toolGroup => {
      // Skip the tool groups excluded from case progress
      if (!MeasurementApi.isToolIncluded(toolGroup)) {
        return;
      }
      toolGroup.childTools.forEach(tool => {
        // Skip the tools excluded from case progress
        if (!MeasurementApi.isToolIncluded(tool)) {
          return;
        }
        const measurements = this.tools[tool.id];
        measurements.forEach(measurement => {
          MeasurementApi.syncMeasurementAndToolData(measurement);
        });
      });
    });
  }

  deleteMeasurements(toolType, measurementTypeId, filter) {
    const filterKeys = Object.keys(filter);
    const groupCollection = this.toolGroups[measurementTypeId];

    // Stop here if it is a temporary toolGroups
    if (!groupCollection) return;

    // Get the entries information before removing them
    const groupItems = groupCollection.filter(toolGroup => {
      return filterKeys.every(
        filterKey => toolGroup[filterKey] === filter[filterKey]
      );
    });
    const entries = [];
    groupItems.forEach(groupItem => {
      if (!groupItem.toolId) {
        return;
      }

      const collection = this.tools[groupItem.toolId];
      const toolIndex = collection.findIndex(
        tool => tool._id === groupItem.toolItemId
      );
      if (toolIndex > -1) {
        entries.push(collection[toolIndex]);
        collection.splice(toolIndex, 1);
      }
    });

    // Stop here if no entries were found
    if (!entries.length) {
      return;
    }

    // If the filter doesn't have the measurement number, get it from the first entry
    const lesionNamingNumber =
      filter.lesionNamingNumber || entries[0].lesionNamingNumber;

    // Synchronize the new data with cornerstone tools
    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();

    entries.forEach(entry => {
      const measurementsData = [];
      const { tool } = MeasurementApi.getToolConfiguration(entry.toolType);
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
        const imageId = getImageIdForImagePath(imagePath);
        if (imageId && toolState[imageId]) {
          const toolData = toolState[imageId][toolType];
          const measurementEntries = toolData && toolData.data;
          const measurementEntry = measurementEntries.find(
            mEntry => mEntry._id === entry._id
          );
          if (measurementEntry) {
            const index = measurementEntries.indexOf(measurementEntry);
            measurementEntries.splice(index, 1);
          }
        }
      });

      this.onMeasurementRemoved(toolType, entry);
    });

    cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(
      toolState
    );

    // Synchronize the updated measurements with Cornerstone Tools
    // toolData to make sure the displayed measurements show 'Target X' correctly
    const syncFilter = Object.assign({}, filter);
    delete syncFilter.timepointId;
    delete syncFilter.lesionNamingNumber;

    const syncFilterKeys = Object.keys(syncFilter);

    const toolTypes = [...new Set(entries.map(entry => entry.toolType))];
    toolTypes.forEach(toolType => {
      const collection = this.tools[toolType];
      collection
        .filter(tool => {
          return (
            tool.lesionNamingNumber > lesionNamingNumber - 1 &&
            syncFilterKeys.every(
              syncFilterKey => tool[syncFilterKey] === filter[syncFilterKey]
            )
          );
        })
        .forEach(measurement => {
          MeasurementApi.syncMeasurementAndToolData(measurement);
        });
    });
  }
}
