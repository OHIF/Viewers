import { connect } from 'react-redux';
import Viewer from './Viewer.js';
import OHIF from '@ohif/core';

const { setTimepoints, setMeasurements } = OHIF.redux.actions;

const getActiveServer = servers => {
  const isActive = a => a.active === true;
  return servers.servers.find(isActive);
};

const mapStateToProps = state => {
  const { viewports, servers } = state;
  return {
    viewports: viewports.viewportSpecificData,
    activeViewportIndex: viewports.activeViewportIndex,
    activeServer: getActiveServer(servers),
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
  };
};

const ConnectedViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer);

export default ConnectedViewer;
