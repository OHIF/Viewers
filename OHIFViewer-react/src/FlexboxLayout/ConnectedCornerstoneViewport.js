import { connect } from 'react-redux';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF from 'ohif-core'

const { setViewportActive } = OHIF.redux.actions;

const mapStateToProps = state => {
    const activeButton = state.tools.buttons.find(tool => tool.active === true);

    return {
        layout: state.viewports.layout,
        activeViewportIndex: state.viewports.activeViewportIndex,
        activeTool: activeButton && activeButton.command
    };
};

const mapDispatchToProps = dispatch => {
    return {
        setViewportActive: viewportIndex => {
            console.log(`setViewportActive: ${viewportIndex}`);
            dispatch(setViewportActive(viewportIndex))
        }
    };
};

const ConnectedCornerstoneViewport = connect(
    mapStateToProps,
    mapDispatchToProps
)(CornerstoneViewport);

export default ConnectedCornerstoneViewport;
