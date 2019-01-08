import { connect } from 'react-redux';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF from 'ohif-core'

const { setViewportActive } = OHIF.redux.actions;

const mapStateToProps = (state, ownProps) => {
    const activeButton = state.tools.buttons.find(tool => tool.active === true);

    // If this is the active viewport, enable prefetching.
    const enableStackPrefetch = ownProps.viewportData.viewportIndex === state.viewports.activeViewportIndex;

    return {
        layout: state.viewports.layout,
        activeViewportIndex: state.viewports.activeViewportIndex,
        activeTool: activeButton && activeButton.command,
        enableStackPrefetch
    };
};

const mapDispatchToProps = dispatch => {
    return {
        setViewportActive: viewportIndex => {
            dispatch(setViewportActive(viewportIndex))
        }
    };
};

const ConnectedCornerstoneViewport = connect(
    mapStateToProps,
    mapDispatchToProps
)(CornerstoneViewport);

export default ConnectedCornerstoneViewport;
