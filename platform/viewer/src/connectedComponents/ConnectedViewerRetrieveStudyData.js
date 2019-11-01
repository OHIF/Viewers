import { connect } from 'react-redux';
import ViewerRetrieveStudyData from './ViewerRetrieveStudyData.js';
import OHIF from "@ohif/core";

const { setStudyData } = OHIF.redux.actions;

const isActive = a => a.active === true;

const mapStateToProps = state => {
  const activeServer = state.servers.servers.find(isActive);

  return {
    server: activeServer,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onStudyLoaded: (studyInstanceUID, data) => {
      dispatch(setStudyData(studyInstanceUID, data));
    }
  };
};

const ConnectedViewerRetrieveStudyData = connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewerRetrieveStudyData);

export default ConnectedViewerRetrieveStudyData;
