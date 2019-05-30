import { connect } from 'react-redux';
import ViewerRetrieveStudyData from './ViewerRetrieveStudyData.js';

const isActive = a => a.active === true;

const mapStateToProps = state => {
  const activeServer = state.servers.servers.find(isActive);

  return {
    server: activeServer,
  };
};

const ConnectedViewerRetrieveStudyData = connect(
  mapStateToProps,
  null
)(ViewerRetrieveStudyData);

export default ConnectedViewerRetrieveStudyData;
