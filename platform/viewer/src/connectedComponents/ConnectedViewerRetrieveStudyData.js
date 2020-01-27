import { connect } from 'react-redux';
import ViewerRetrieveStudyData from './ViewerRetrieveStudyData.js';
import OHIF from "@ohif/core";

const { clearViewportSpecificData } = OHIF.redux.actions;
const isActive = a => a.active === true;

const mapStateToProps = (state, ownProps) => {
  const activeServer = state.servers.servers.find(isActive);

  return {
    server: ownProps.server || activeServer,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    clearViewportSpecificData: () => {
      dispatch(clearViewportSpecificData());
    },
  };
};

const ConnectedViewerRetrieveStudyData = connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewerRetrieveStudyData);

export default ConnectedViewerRetrieveStudyData;
