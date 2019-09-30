import { connect } from 'react-redux';
import Viewer from './Viewer.js';
import OHIF from '@ohif/core';

const {
  setTimepoints,
  setMeasurements,
  setViewportSpecificData,
  clearViewportSpecificData,
} = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
  const {
    activeViewportIndex,
    numRows,
    numColumns,
    viewportPanes,
    viewportSpecificData,
  } = state.viewports;

  return {
    numRows,
    numColumns,
    viewportPanes,
    activeViewportIndex,
    //
    viewportSpecificData,
    viewports: state.viewports,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onTimepointsUpdated: timepoints => {
      dispatch(setTimepoints(timepoints));
    },
    onMeasurementsUpdated: measurements => {
      dispatch(setMeasurements(measurements));
    },
    //
    setViewportSpecificData: (viewportIndex, data) => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    },
    clearViewportSpecificData: () => {
      dispatch(clearViewportSpecificData());
    },
  };
};

const ConnectedViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer);

export default ConnectedViewer;
