import { connect } from 'react-redux';
import Viewer from './SelectMask';
import OHIF from '@ohif/core';

const { setTimepoints, setMeasurements } = OHIF.redux.actions;

const getActiveServer = servers => {
  const isActive = a => a.active === true;
  return servers.servers.find(isActive);
};

const mapStateToProps = state => {
  const { viewports, servers, oidc } = state;
  return {
    viewports: viewports.viewportSpecificData,
    activeViewportIndex: viewports.activeViewportIndex,
    activeServer: getActiveServer(servers),
    user: oidc.user,
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

const ConnectedSelectMask = connect(
  mapStateToProps,
  mapDispatchToProps
)(Viewer);

export default ConnectedSelectMask;
