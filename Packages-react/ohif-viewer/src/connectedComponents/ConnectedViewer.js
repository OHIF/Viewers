import { connect } from 'react-redux';
import Viewer from './Viewer.js';
import actions from '../redux/actions.js';

const mapDispatchToProps = dispatch => {
  return {
    onTimepointsUpdated: timepoints => {
      dispatch(actions.setTimepoints(timepoints));
    },
    onMeasurementsUpdated: measurements => {
      dispatch(actions.setMeasurements(measurements));
    }
  };
};

const ConnectedViewer = connect(
  null,
  mapDispatchToProps
)(Viewer);

export default ConnectedViewer;
