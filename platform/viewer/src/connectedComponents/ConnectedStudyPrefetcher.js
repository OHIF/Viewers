import { connect } from 'react-redux';

import StudyPrefetcher from '../components/StudyPrefetcher';

const mapStateToProps = (state, ownProps) => {
  const activeViewportData =
    state.viewports.viewportSpecificData[state.viewports.activeViewportIndex] ||
    {};

  const { displaySetInstanceUID } = activeViewportData;

  return {
    activeViewportDisplaySetInstanceUID: displaySetInstanceUID,
  };
};

const ConnectedStudyPrefetcher = connect(mapStateToProps)(StudyPrefetcher);

export default ConnectedStudyPrefetcher;
