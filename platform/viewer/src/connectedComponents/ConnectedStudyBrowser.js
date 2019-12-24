import OHIF from '@ohif/core';
import { connect } from 'react-redux';
import { StudyBrowser } from '@ohif/ui';
import cloneDeep from 'lodash.clonedeep';

const { setActiveViewportSpecificData } = OHIF.redux.actions;

// TODO
// - Determine in which display set is active from Redux (activeViewportIndex and layout viewportData)
// - Pass in errors and stack loading progress from Redux
const mapStateToProps = (state, ownProps) => {
  // If we know that the stack loading progress details have changed,
  // we can try to update the component state so that the thumbnail
  // progress bar is updated
  const stackLoadingProgressMap = state.loading.progress;
  const studiesWithLoadingData = cloneDeep(ownProps.studies);

  studiesWithLoadingData.forEach(study => {
    study.thumbnails.forEach(data => {
      const { displaySetInstanceUid } = data;
      const stackId = `StackProgress:${displaySetInstanceUid}`;
      const stackProgressData = stackLoadingProgressMap[stackId];

      let stackPercentComplete = 0;
      if (stackProgressData) {
        stackPercentComplete = stackProgressData.percentComplete;
      }

      data.stackPercentComplete = stackPercentComplete;
    });
  });

  return {
    studies: studiesWithLoadingData,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onThumbnailClick: displaySetInstanceUid => {
      const displaySet = ownProps.studyMetadata[0].displaySets.find(
        ds => ds.displaySetInstanceUid === displaySetInstanceUid
      );

      dispatch(setActiveViewportSpecificData(displaySet));
    },
  };
};

const ConnectedStudyBrowser = connect(
  mapStateToProps,
  mapDispatchToProps
)(StudyBrowser);

export default ConnectedStudyBrowser;
