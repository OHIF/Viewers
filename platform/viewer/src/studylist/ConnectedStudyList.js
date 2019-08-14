import { connect } from 'react-redux';

import StudyListWithData from './StudyListWithData.js';

const isActive = a => a.active === true;

const mapStateToProps = state => {
  const activeServer = state.servers.servers.find(isActive);

  return {
    server: activeServer,
    user: state.oidc.user,
  };
};

const ConnectedStudyList = connect(
  mapStateToProps,
  null
)(StudyListWithData);

export default ConnectedStudyList;
