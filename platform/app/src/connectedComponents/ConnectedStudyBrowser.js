import OHIF from '@ohif/core';
import { connect } from 'react-redux';
// import { StudyBrowser } from '@ohif/ui';
import cloneDeep from 'lodash.clonedeep';
import findDisplaySetByUID from './findDisplaySetByUID';
import { servicesManager } from './../App.js';
import { XNATStudyBrowser } from '@xnat-ohif/extension-xnat';

const { studyMetadataManager } = OHIF.utils;
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
      const { displaySetInstanceUID } = data;
      const stackId = `StackProgress:${displaySetInstanceUID}`;
      const stackProgressData = stackLoadingProgressMap[stackId];

      let stackPercentComplete = 0;
      if (stackProgressData) {
        stackPercentComplete = stackProgressData.percentComplete;
      }

      data.stackPercentComplete = stackPercentComplete;
    });
  });

  const activeViewportIndex = state.viewports.activeViewportIndex;

  return {
    studies: studiesWithLoadingData,
    activeViewportIndex,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    setActiveViewportDisplaySet: displaySet => {
      dispatch(setActiveViewportSpecificData(displaySet));
    },
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { studyMetadata } = ownProps;
  const { activeViewportIndex } = stateProps;
  const { setActiveViewportDisplaySet } = dispatchProps;

  const onThumbnailClick = displaySetInstanceUID => {
    let displaySet = findDisplaySetByUID(
      studyMetadata,
      displaySetInstanceUID
    );

    if (displaySet.isDerived) {
      const { Modality } = displaySet;
      if (Modality === 'SEG' && servicesManager) {
        const {LoggerService, UINotificationService} = servicesManager.services;
        const onDisplaySetLoadFailureHandler = error => {
          LoggerService.error({ error, message: error.message });
          UINotificationService.show({
            title: 'DICOM Segmentation Loader',
            message: error.message,
            type: 'error',
            autoClose: true,
          });
        };

        const {
          referencedDisplaySet,
          activatedLabelmapPromise,
        } = displaySet.getSourceDisplaySet(
          ownProps.studyMetadata,
          true,
          onDisplaySetLoadFailureHandler
        );
        displaySet = referencedDisplaySet;

        activatedLabelmapPromise.then((activatedLabelmapIndex) => {
          const selectionFired = new CustomEvent("extensiondicomsegmentationsegselected", {
            "detail": {"activatedLabelmapIndex":activatedLabelmapIndex}
          });
          document.dispatchEvent(selectionFired);
        });

      } else {
        displaySet = displaySet.getSourceDisplaySet(ownProps.studyMetadata);
      }

      if (!displaySet) {
        throw new Error(
          `Referenced series for ${Modality} dataset not present.`
        );
      }

      if (!displaySet) {
        throw new Error('Source data not present');
      }
    }

    if (displaySet.hasMultiDisplaySets && displaySet.subDisplaySetGroupData) {
      const groupActiveDisplaySet = displaySet.subDisplaySetGroupData.getDisplaySet(
        { viewportIndex: activeViewportIndex }
      );
      if (groupActiveDisplaySet) {
        displaySet = groupActiveDisplaySet;
      }
    }

    if (displaySet.isValidMultiStack && displaySet.getSubStackGroupData) {
      const subStackGroupData = displaySet.getSubStackGroupData();
      const stackDisplaySet = subStackGroupData.getStackDisplaySet({
        viewportIndex: activeViewportIndex,
      });
      if (stackDisplaySet) {
        displaySet = stackDisplaySet;
      }
    }

    setActiveViewportDisplaySet(displaySet);
  };

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    onThumbnailClick,
  };
};

const ConnectedStudyBrowser = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(XNATStudyBrowser);

export default ConnectedStudyBrowser;
