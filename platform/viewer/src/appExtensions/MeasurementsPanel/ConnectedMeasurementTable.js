import { connect } from 'react-redux';
import { MeasurementTable } from '@ohif/ui';
import OHIF from '@ohif/core';
import moment from 'moment';
import cornerstone from 'cornerstone-core';

//
import jumpToRowItem from './jumpToRowItem.js';
import getMeasurementLocationCallback from './../../lib/getMeasurementLocationCallback';

const { setViewportSpecificData } = OHIF.redux.actions;
const { MeasurementApi } = OHIF.measurements;

function groupBy(list, props) {
  return list.reduce((a, b) => {
    (a[b[props]] = a[b[props]] || []).push(b);
    return a;
  }, {});
}

function getAllTools() {
  const config = OHIF.measurements.MeasurementApi.getConfiguration();
  let tools = [];
  config.measurementTools.forEach(
    toolGroup => (tools = tools.concat(toolGroup.childTools))
  );

  return tools;
}

function getMeasurementText(measurementData) {
  const { location, description } = measurementData;
  let text = '...';
  if (location) {
    text = location;
    if (description) {
      text += `(${description})`;
    }
  }
  return text;
}

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

function convertMeasurementsToTableData(toolCollections, timepoints) {
  const config = OHIF.measurements.MeasurementApi.getConfiguration();
  const toolGroups = config.measurementTools;
  const tools = getAllTools();

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

      //check if all measurements with same measurementNumber will have same LABEL
      const tableMeasurement = {
        itemNumber: lesionNamingNumber,
        label: getMeasurementText(measurementData),
        measurementId,
        measurementNumber,
        lesionNamingNumber,
        toolType,
        hasWarnings: false, //TODO
        warningTitle: '', //TODO
        isSplitLesion: false, //TODO
        warningList: [], //TODO
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

const mapStateToProps = state => {
  const { timepoints, measurements } = state.timepointManager;
  return {
    timepoints: convertTimepointsToTableData(timepoints),
    measurementCollection: convertMeasurementsToTableData(
      measurements,
      timepoints
    ),
    timepointManager: state.timepointManager,
    viewports: state.viewports,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dispatchRelabel: (event, measurementData, viewportsState) => {
      const activeViewportIndex =
        (viewportsState && viewportsState.activeViewportIndex) || 0;

      const enabledElements = cornerstone.getEnabledElements();
      if (!enabledElements || enabledElements.length <= activeViewportIndex) {
        OHIF.log.error('Failed to find the enabled element');
        return;
      }

      const { element } = enabledElements[activeViewportIndex];

      const eventData = {
        event: {
          clientX: event.clientX,
          clientY: event.clientY,
        },
        element,
      };

      const { toolType, measurementId } = measurementData;
      const tool = MeasurementApi.Instance.tools[toolType].find(measurement => {
        return measurement._id === measurementId;
      });

      const options = {
        skipAddLabelButton: true,
        editLocation: true,
      };

      // Clone the tool not to set empty location initially
      const toolForLocation = Object.assign({}, tool, { location: null });
      getMeasurementLocationCallback(eventData, toolForLocation, options);
    },
    dispatchEditDescription: (event, measurementData, viewportsState) => {
      const activeViewportIndex =
        (viewportsState && viewportsState.activeViewportIndex) || 0;

      const enabledElements = cornerstone.getEnabledElements();
      if (!enabledElements || enabledElements.length <= activeViewportIndex) {
        OHIF.log.error('Failed to find the enabled element');
        return;
      }

      const { element } = enabledElements[activeViewportIndex];

      const eventData = {
        event: {
          clientX: event.clientX,
          clientY: event.clientY,
        },
        element,
      };

      const { toolType, measurementId } = measurementData;
      const tool = MeasurementApi.Instance.tools[toolType].find(measurement => {
        return measurement._id === measurementId;
      });

      const options = {
        editDescriptionOnDialog: true,
      };

      getMeasurementLocationCallback(eventData, tool, options);
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
        cornerstone.updateImage(enabledElement.element);
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
  return {
    timepoints: propsFromState.timepoints,
    measurementCollection: propsFromState.measurementCollection,
    selectedMeasurementNumber: ownProps.selectedMeasurementNumber,
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
