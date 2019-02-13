import { connect } from 'react-redux';
import { MeasurementTable } from 'react-viewerbase';
import OHIF from 'ohif-core';
import moment from 'moment';

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

function convertMeasurementsToTableData(measurements) {
  const tableData = [
    {
      groupName: 'Measurements',
      measurements: []
    }
  ];

  if (measurements) {
    const config = OHIF.measurements.MeasurementApi.getConfiguration();
    const tools = config.measurementTools.find(
      toolGroup => toolGroup.id === 'allTools'
    ).childTools;
    Object.keys(measurements).forEach(toolId => {
      const tool = tools.find(tool => tool.id === toolId);
      console.warn(tool);

      const measurementsData = measurements[toolId];

      measurementsData.forEach(measurementData => {
        const tableMeasurement = {
          label: '...',
          hasWarnings: false,
          warningTitle: '',
          isSplitLesion: false,
          warningList: [],
          data: [
            {
              displayText: tool.options.measurementTable.displayFunction(
                measurementData
              )
            }
          ]
        };
        tableData[0].measurements.push(tableMeasurement);
      });
    });
  }

  return tableData;
}

const mapStateToProps = state => {
  const { timepoints, measurements } = state.timepointManager;
  return {
    timepoints: convertTimepointsToTableData(timepoints),
    measurementCollection: convertMeasurementsToTableData(measurements)
  };
};

const ConnectedMeasurementTable = connect(
  mapStateToProps,
  null
)(MeasurementTable);

export default ConnectedMeasurementTable;
