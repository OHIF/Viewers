import { connect } from 'react-redux';
import { MeasurementTable } from 'react-viewerbase';
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

  if (!measurements || !measurements.length) {
    return tableData;
  }

  // TODO: Add measurements into tableData

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
