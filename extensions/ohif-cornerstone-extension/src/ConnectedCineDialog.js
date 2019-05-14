import { connect } from 'react-redux';
import { CineDialog } from 'react-viewerbase';
import OHIF from 'ohif-core';
import cloneDeep from 'lodash.clonedeep';

const { setViewportSpecificData } = OHIF.redux.actions;

// Why do I need or care about any of this info?
// A dispatch action should be able to pull this at the time of an event?
// `isPlaying` and `cineFrameRate` might matter, but I think we can prop pass for those.
const mapStateToProps = state => {
  // Get activeViewport's `cine` and `stack`
  const { viewportSpecificData, activeViewportIndex } = state.viewports;
  const { cine, stack } = viewportSpecificData[activeViewportIndex] || {};

  const stackData = stack || {
    imageIds: [],
    currentImageIdIndex: 0
  };

  const cineData = cine || {
    isPlaying: false,
    cineFrameRate: 24
  };

  // TODO: activeViewportStackData won't currently change anything on
  // CornerstoneViewport. The updates are too frequent and it's killing
  // performance. Need to revisit how we can do this.

  // New props we're creating?
  return {
    activeViewportStackData: stackData,
    activeViewportCineData: cineData,
    activeViewportIndex: state.viewports.activeViewportIndex
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dispatchSetViewportSpecificData: (viewportIndex, data) => {
      dispatch(setViewportSpecificData(viewportIndex, data));
    }
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  const {
    activeViewportStackData,
    activeViewportCineData,
    activeViewportIndex
  } = propsFromState;

  return {
    cineFrameRate: activeViewportCineData.cineFrameRate,
    isPlaying: activeViewportCineData.isPlaying,
    onPlayPauseChanged: isPlaying => {
      const cine = cloneDeep(activeViewportCineData);
      cine.isPlaying = !cine.isPlaying;

      propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, {
        cine
      });
    },
    onFrameRateChanged: frameRate => {
      const cine = cloneDeep(activeViewportCineData);
      cine.cineFrameRate = frameRate;

      propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, {
        cine
      });
    },
    onClickNextButton: () => {
      const stack = cloneDeep(activeViewportStackData);
      const largestPossibleIndex = stack.imageIds.length - 1;
      stack.currentImageIdIndex = Math.min(
        stack.currentImageIdIndex + 1,
        largestPossibleIndex
      );

      propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, {
        stack
      });
    },
    onClickBackButton: () => {
      const stack = cloneDeep(activeViewportStackData);
      stack.currentImageIdIndex = Math.max(stack.currentImageIdIndex - 1, 0);

      propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, {
        stack
      });
    },
    onClickSkipToStart: () => {
      const stack = cloneDeep(activeViewportStackData);
      stack.currentImageIdIndex = 0;

      propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, {
        stack
      });
    },
    onClickSkipToEnd: () => {
      const stack = cloneDeep(activeViewportStackData);
      stack.currentImageIdIndex = stack.imageIds.length;

      propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, {
        stack
      });
    }
  };
};

const ConnectedCineDialog = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(CineDialog);

export default ConnectedCineDialog;
