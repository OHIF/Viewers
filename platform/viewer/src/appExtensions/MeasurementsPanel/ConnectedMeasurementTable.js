import { connect } from 'react-redux';
import { MeasurementTable } from '@ohif/ui';
import OHIF, { DICOMSR } from '@ohif/core';
import moment from 'moment';
import cornerstone from 'cornerstone-core';

import jumpToRowItem from './jumpToRowItem.js';

const { setViewportSpecificData } = OHIF.redux.actions;
const { MeasurementApi } = OHIF.measurements;

/**
 * Takes a list of objects and a property and return the list grouped by the property
 *
 * @param {Array} list - The objects to be grouped by
 * @param {string} props - The property to group the objects
 * @returns {Object}
 */
function groupBy(list, props) {
  return list.reduce((a, b) => {
    (a[b[props]] = a[b[props]] || []).push(b);
    return a;
  }, {});
}

/**
 *  Takes a list of tools grouped and return all tools separately
 *
 * @param {Array} [toolGroups=[]] - The grouped tools
 * @returns {Array} - The list of all tools on all groups
 */
function getAllTools(toolGroups = []) {
  let tools = [];
  toolGroups.forEach(toolGroup => (tools = tools.concat(toolGroup.childTools)));

  return tools;
}

/**
 * Takes measurementData and build the measurement text to be used into the table
 *
 * @param {Object} [measurementData={}]
 * @param {string} measurementData.location - The measurement location
 * @param {string} measurementData.description - The measurement description
 * @returns {string}
 */
function getMeasurementText(measurementData = {}) {
  const defaultText = '...';
  const { location = '', description = '' } = measurementData;
  const result = location + (description ? ` (${description})` : '');

  return result || defaultText;
}

/**
 * Takes a list of measurements grouped by measurement numbers and return each measurement data by available timepoint
 *
 * @param {Array} measurementNumberList - The list of measurements
 * @param {Array} timepoints - The list of available timepoints
 * @param {Function} displayFunction - The function that builds the display text by each tool
 * @returns
 */
function getDataForEachMeasurementNumber(
  measurementNumberList,
  timepoints,
  displayFunction
) {
  const data = [];
  // on each measurement number we should get each measurement data by available timepoint
  measurementNumberList.forEach(measurement => {
    timepoints.forEach(timepoint => {
      const eachData = {
        displayText: '...',
      };
      if (measurement.timepointId === timepoint.timepointId) {
        eachData.displayText = displayFunction(measurement);
      }
      data.push(eachData);
    });
  });

  return data;
}

/**
 * Take a measurement toolName and return if any warnings
 *
 * @param {string} toolName - The tool name
 * @returns {string}
 */
function getWarningsForMeasurement(toolName) {
  const isToolSupported = DICOMSR.isToolSupported(toolName);

  return {
    hasWarnings: !isToolSupported,
    warningTitle: isToolSupported ? '' : 'Unsupported Tool',
    warningList: isToolSupported
      ? []
      : [`${toolName} cannot be persisted at this time`],
  };
}

/**
 * Take measurements from MeasurementAPI structure and convert into a measurementTable structure
 *
 * @param {Object} toolCollections - The list of all measurement grouped by groupTool and toolName
 * @param {Array} timepoints - The list of available timepoints
 * @returns
 */
function convertMeasurementsToTableData(toolCollections, timepoints) {
  const config = OHIF.measurements.MeasurementApi.getConfiguration();
  const toolGroups = config.measurementTools;
  const tools = getAllTools(toolGroups);

  const tableMeasurements = toolGroups.map(toolGroup => {
    return {
      groupName: toolGroup.name,
      groupId: toolGroup.id,
      measurements: [],
    };
  });

  Object.keys(toolCollections).forEach(toolId => {
    const toolMeasurements = toolCollections[toolId];
    const tool = tools.find(tool => tool.id === toolId);
    const { displayFunction } = tool.options.measurementTable;

    // Group by measurementNumber so we can display then all in the same line
    const groupedMeasurements = groupBy(toolMeasurements, 'measurementNumber');

    Object.keys(groupedMeasurements).forEach(groupedMeasurementsIndex => {
      const measurementNumberList =
        groupedMeasurements[groupedMeasurementsIndex];
      const measurementData = measurementNumberList[0];
      const {
        measurementNumber,
        lesionNamingNumber,
        toolType,
      } = measurementData;
      const measurementId = measurementData._id;

      const {
        hasWarnings,
        warningTitle,
        warningList,
      } = getWarningsForMeasurement(toolType);

      //check if all measurements with same measurementNumber will have same LABEL
      const tableMeasurement = {
        itemNumber: lesionNamingNumber,
        label: getMeasurementText(measurementData),
        measurementId,
        measurementNumber,
        lesionNamingNumber,
        toolType,
        hasWarnings,
        warningTitle,
        warningList,
        isSplitLesion: false, //TODO
        data: getDataForEachMeasurementNumber(
          measurementNumberList,
          timepoints,
          displayFunction
        ),
      };

      // find the group object for the tool
      const toolGroupMeasurements = tableMeasurements.find(group => {
        return group.groupId === tool.toolGroup;
      });
      // inject the new measurement for this measurementNumer
      toolGroupMeasurements.measurements.push(tableMeasurement);
    });
  });

  // Sort measurements by lesion naming number
  tableMeasurements.forEach(tm => {
    tm.measurements.sort((m1, m2) =>
      m1.lesionNamingNumber > m2.lesionNamingNumber ? 1 : -1
    );
  });

  return tableMeasurements;
}

/**
 * Take a list of available timepoints and return a list header information for each timepoint
 *
 * @param {Array} timepoints - The list of available timepoints
 * @param {string} timepoints[].latestDate - The date of the last study taken on the timepoint
 * @returns {{label: string, key: string, date: string}[]}
 */
function convertTimepointsToTableData(timepoints) {
  if (!timepoints || !timepoints.length) {
    return [];
  }

  return [
    {
      label: 'Study date:',
      key: 'StudyDate',
      date: moment(timepoints[0].latestDate).format('DD-MMM-YY'),
    },
  ];
}

/**
 *  Takes server type and return a function or undefined
 *
 * @param {string} serverType - The server type
 * @returns {undefined|Function}
 */
function getSaveFunction(serverType) {
  if (serverType === 'dicomWeb') {
    return () => {
      const measurementApi = OHIF.measurements.MeasurementApi.Instance;
      const promise = measurementApi.storeMeasurements();
      return promise;
    };
  }
}

const mapStateToProps = state => {
  const { timepointManager, servers } = state;
  const { timepoints, measurements } = timepointManager;
  const activeServer = servers.servers.find(a => a.active === true);
  const saveFunction = getSaveFunction(activeServer.type);

  return {
    timepoints: convertTimepointsToTableData(timepoints),
    measurementCollection: convertMeasurementsToTableData(
      measurements,
      timepoints
    ),
    timepointManager: state.timepointManager,
    viewports: state.viewports,
    saveFunction,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    dispatchRelabel: (event, measurementData, viewportsState) => {
      event.persist();

      const activeViewportIndex =
        (viewportsState && viewportsState.activeViewportIndex) || 0;

      const enabledElements = cornerstone.getEnabledElements();
      if (!enabledElements || enabledElements.length <= activeViewportIndex) {
        OHIF.log.error('Failed to find the enabled element');
        return;
      }

      const { toolType, measurementId } = measurementData;
      const tool = MeasurementApi.Instance.tools[toolType].find(measurement => {
        return measurement._id === measurementId;
      });

      // Clone the tool not to set empty location initially
      const toolForLocation = Object.assign({}, tool, { location: null });

      if (ownProps.onRelabel) {
        ownProps.onRelabel(toolForLocation);
      }
    },
    dispatchEditDescription: (event, measurementData, viewportsState) => {
      event.persist();

      const activeViewportIndex =
        (viewportsState && viewportsState.activeViewportIndex) || 0;

      const enabledElements = cornerstone.getEnabledElements();
      if (!enabledElements || enabledElements.length <= activeViewportIndex) {
        OHIF.log.error('Failed to find the enabled element');
        return;
      }

      const { toolType, measurementId } = measurementData;
      const tool = MeasurementApi.Instance.tools[toolType].find(measurement => {
        return measurement._id === measurementId;
      });

      if (ownProps.onEditDescription) {
        ownProps.onEditDescription(tool);
      }
    },
    dispatchJumpToRowItem: (
      measurementData,
      viewportsState,
      timepointManagerState,
      options
    ) => {
      const actionData = jumpToRowItem(
        measurementData,
        viewportsState,
        timepointManagerState,
        dispatch,
        options
      );

      actionData.viewportSpecificData.forEach(viewportSpecificData => {
        const { viewportIndex, displaySet } = viewportSpecificData;

        dispatch(setViewportSpecificData(viewportIndex, displaySet));
      });

      const { toolType, measurementNumber } = measurementData;
      const measurementApi = MeasurementApi.Instance;

      Object.keys(measurementApi.tools).forEach(toolType => {
        const measurements = measurementApi.tools[toolType];

        measurements.forEach(measurement => {
          measurement.active = false;
        });
      });

      const measurementsToActive = measurementApi.tools[toolType].filter(
        measurement => {
          return measurement.measurementNumber === measurementNumber;
        }
      );

      measurementsToActive.forEach(measurementToActive => {
        measurementToActive.active = true;
      });

      measurementApi.syncMeasurementsAndToolData();

      cornerstone.getEnabledElements().forEach(enabledElement => {
        if (enabledElement.image) {
          cornerstone.updateImage(enabledElement.element);
        }
      });

      // Needs to update viewports.layout state to set layout
      //const layout = actionData.layout;
      //dispatch(setLayout(layout))

      // Needs to update viewports.activeViewportIndex to the first updated viewport
      //const viewportIndex = actionData.viewportIndex;
      //dispatch(setViewportActive(viewportIndex));

      // Needs to update timepointsManager.measurements state to set active measurementId
      // TODO: Not yet implemented
      //dispatch(setActiveMeasurement(measurementData.measurementId))

      // (later): Needs to set some property on state.extensions.cornerstone to synchronize viewport scrolling
    },
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  const { timepoints, saveFunction, measurementCollection } = propsFromState;
  const { onSaveComplete, selectedMeasurementNumber } = ownProps;

  return {
    timepoints,
    saveFunction,
    measurementCollection,
    onSaveComplete,
    selectedMeasurementNumber,
    ...propsFromDispatch,
    onItemClick: (event, measurementData) => {
      // TODO: Add timepointId to .data for measurementData?
      // TODO: Tooltype should be on the level below? This should
      // provide the entire row item?

      const viewportsState = propsFromState.viewports;
      const timepointManagerState = propsFromState.timepointManager;

      // TODO: invertViewportTimepointsOrder should be stored in / read from user preferences
      // TODO: childToolKey should come from the measurement table when it supports child tools
      const options = {
        invertViewportTimepointsOrder: false,
        childToolKey: null,
      };

      propsFromDispatch.dispatchJumpToRowItem(
        measurementData,
        viewportsState,
        timepointManagerState,
        options
      );
    },
    onRelabelClick: (event, measurementData) => {
      const viewportsState = propsFromState.viewports;
      propsFromDispatch.dispatchRelabel(event, measurementData, viewportsState);
    },
    onEditDescriptionClick: (event, measurementData) => {
      const viewportsState = propsFromState.viewports;
      propsFromDispatch.dispatchEditDescription(
        event,
        measurementData,
        viewportsState
      );
    },
    onDeleteClick: (event, measurementData) => {
      const { MeasurementHandlers } = OHIF.measurements;

      MeasurementHandlers.onRemoved({
        detail: {
          toolType: measurementData.toolType,
          measurementData: {
            _id: measurementData.measurementId,
            lesionNamingNumber: measurementData.lesionNamingNumber,
            measurementNumber: measurementData.measurementNumber,
          },
        },
      });
    },
  };
};

const ConnectedMeasurementTable = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(MeasurementTable);

export default ConnectedMeasurementTable;
