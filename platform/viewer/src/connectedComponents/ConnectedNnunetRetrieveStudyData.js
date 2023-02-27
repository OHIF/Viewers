import { connect } from 'react-redux';
import OHIF from '@ohif/core';
import Nnunet from '../pages/Nnunet_old';

const { clearViewportSpecificData, setStudyData } = OHIF.redux.actions;
const isActive = a => a.active === true;

const mapStateToProps = (state, ownProps) => {
  const activeServer = state.servers.servers.find(isActive);

  return {
    server: ownProps.server || activeServer,
  };
};
const mapDispatchToProps = dispatch => {
  return {
    setStudyData: (StudyInstanceUID, data) => {
      dispatch(setStudyData(StudyInstanceUID, data));
    },
    clearViewportSpecificData: () => {
      dispatch(clearViewportSpecificData());
    },
  };
};

const ConnectedNnunetRetrieveStudyData = connect(
  mapStateToProps,
  mapDispatchToProps
)(Nnunet);

export default ConnectedNnunetRetrieveStudyData;
