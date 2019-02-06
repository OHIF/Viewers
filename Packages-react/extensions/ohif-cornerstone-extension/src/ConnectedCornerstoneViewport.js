import { connect } from 'react-redux';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF from 'ohif-core'
import cornerstone from "cornerstone-core";
import cornerstoneTools from "cornerstone-tools";

const { setViewportActive, setViewportSpecificData, clearViewportSpecificData } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
    const activeButton = state.tools.buttons.find(tool => tool.active === true);

    // If this is the active viewport, enable prefetching.
    const { viewportIndex } = ownProps;//.viewportData;
    const isActive = viewportIndex === state.viewports.activeViewportIndex;
    const viewportSpecificData = state.viewports.viewportSpecificData[viewportIndex] || {};

    return {
        layout: state.viewports.layout,
        isActive,
        activeTool: activeButton && activeButton.command,
        enableStackPrefetch: isActive,
        //stack: viewportSpecificData.stack,
        cineToolData: viewportSpecificData.cine,
        cornerstone,
        cornerstoneTools
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    const { viewportIndex } = ownProps;

    return {
        setViewportActive: () => {
            dispatch(setViewportActive(viewportIndex))
        },

        setViewportSpecificData: (data) => {
            dispatch(setViewportSpecificData(viewportIndex, data))
        },

        clearViewportSpecificData: () => {
            dispatch(clearViewportSpecificData(viewportIndex));
        }
    };
};

const ConnectedCornerstoneViewport = connect(
    mapStateToProps,
    mapDispatchToProps
)(CornerstoneViewport);

export default ConnectedCornerstoneViewport;
