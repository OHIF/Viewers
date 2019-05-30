import { connect } from 'react-redux';
import Viewer from './Viewer.js';
import OHIF from 'ohif-core';

const { setTimepoints, setMeasurements } = OHIF.redux.actions;

const mapDispatchToProps = dispatch => {
  return {
    onTimepointsUpdated: timepoints => {
      dispatch(setTimepoints(timepoints));
    },
    onMeasurementsUpdated: measurements => {
      dispatch(setMeasurements(measurements));
    },
  };
};

const ConnectedViewer = connect(
  null,
  mapDispatchToProps
)(Viewer);

export default ConnectedViewer;
