import { connect } from 'react-redux';

import StudyPrefetcher from '../components/StudyPrefetcher';

const mapStateToProps = (state, ownProps) => {
  const activeViewportData =
    state.viewports.viewportSpecificData[state.viewports.activeViewportIndex] ||
    {};

  return {
    activeViewportData,
  };
};

const ConnectedStudyPrefetcher = connect(mapStateToProps)(StudyPrefetcher);

export default ConnectedStudyPrefetcher;
