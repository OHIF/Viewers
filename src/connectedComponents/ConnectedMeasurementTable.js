import { connect } from 'react-redux';
import { MeasurementTable } from 'react-viewerbase';
import OHIF from 'ohif-core';
import moment from 'moment';

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
        displayText: '...'
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
      measurements: []
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
      //check if all measurements with same measurementNumber will have same LABEL
      const tableMeasurement = {
        measurementId: measurementNumberList[0]._id,
        label: getMeasurementText(measurementNumberList[0]),
        hasWarnings: false, //TODO
        warningTitle: '', //TODO
        isSplitLesion: false, //TODO
        warningList: [], //TODO
        data: getDataForEachMeasurementNumber(
          measurementNumberList,
          timepoints,
          displayFunction
        )
      };

      // find the group object for the tool
      const toolGroupMeasurements = tableMeasurements.find(group => {
        return group.groupId === tool.toolGroup;
      });
      // inject the new measurement for this measurementNumer
      toolGroupMeasurements.measurements.push(tableMeasurement);
    });
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
      date: moment(timepoints[0].latestDate).format('DD-MMM-YY')
    }
  ];
}

const mapStateToProps = state => {
  const { timepoints, measurements } = state.timepointManager;
  return {
    timepoints: convertTimepointsToTableData(timepoints),
    measurementCollection: convertMeasurementsToTableData(
      measurements,
      timepoints
    )
  };
};

const ConnectedMeasurementTable = connect(
  mapStateToProps,
  null
)(MeasurementTable);

export default ConnectedMeasurementTable;
