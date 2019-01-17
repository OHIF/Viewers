import { connect } from 'react-redux';
import { CineDialog } from 'react-viewerbase';
import OHIF from 'ohif-core';
import cloneDeep from 'lodash.clonedeep';

const { setViewportSpecificData } = OHIF.redux.actions;

// TODO: I'm guessing this function will be used in other connect locations
// so we might want to put it somewhere shared
function getActiveViewportSpecificData(state) {
    const { viewportSpecificData, activeViewportIndex } = state.viewports;
    return viewportSpecificData[activeViewportIndex];
}

const mapStateToProps = state => {
    // TODO:
    // - Test if including CineDialog in the toolbarRow will prevent it
    // from hovering over the rest of the UI when visible.
    //
    // - Create custom ToolbarButton which just shows Play state
    // - Connect this ToolbarButton to Redux
    const activeViewportSpecificData = getActiveViewportSpecificData(state);

    let stack = {
        imageIds: [],
        currentImageIdIndex: 0
    };
    if (activeViewportSpecificData && activeViewportSpecificData.stack) {
        stack = activeViewportSpecificData.stack
    }

    let cine = {
        isPlaying: false,
        cineFrameRate: 24
    };
    if (activeViewportSpecificData && activeViewportSpecificData.cine) {
        cine = activeViewportSpecificData.cine
    }


    // TODO: activeViewportStackData won't currently change anything on
    // CornerstoneViewport. The updates are too frequent and it's killing
    // performance. Need to revisit how we can do this.
    return {
        activeViewportStackData: stack,
        activeViewportCineData: cine,
        activeViewportIndex: state.viewports.activeViewportIndex
    };
};

const mapDispatchToProps = dispatch => {
    return {
        dispatchSetViewportSpecificData: (viewportIndex, data) => {
            dispatch(setViewportSpecificData(viewportIndex, data));
        },
    };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
    const { activeViewportStackData, activeViewportCineData, activeViewportIndex } = propsFromState;

    return {
        cineFrameRate: activeViewportCineData.cineFrameRate,
        isPlaying: activeViewportCineData.isPlaying,
        onPlayPauseChanged: isPlaying => {
            const cine = cloneDeep(activeViewportCineData);
            cine.isPlaying = !cine.isPlaying;

            propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, { cine });
        },
        onFrameRateChanged: frameRate => {
            const cine = cloneDeep(activeViewportCineData);
            cine.cineFrameRate = frameRate;

            propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, { cine });
        },
        onClickNextButton: () => {
            const stack = cloneDeep(activeViewportStackData);
            const largestPossibleIndex = stack.imageIds.length - 1;
            stack.currentImageIdIndex = Math.min(stack.currentImageIdIndex + 1, largestPossibleIndex)

            propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, { stack });
        },
        onClickBackButton: () => {
            const stack = cloneDeep(activeViewportStackData);
            stack.currentImageIdIndex = Math.max(stack.currentImageIdIndex - 1, 0);

            propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, { stack });
        },
        onClickSkipToStart: () => {
            const stack = cloneDeep(activeViewportStackData);
            stack.currentImageIdIndex = 0;

            propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, { stack });
        },
        onClickSkipToEnd: () => {
            const stack = cloneDeep(activeViewportStackData);
            stack.currentImageIdIndex = stack.imageIds.length;

            propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, { stack });
        }
    };
};

const ConnectedCineDialog = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
)(CineDialog);

export default ConnectedCineDialog;
