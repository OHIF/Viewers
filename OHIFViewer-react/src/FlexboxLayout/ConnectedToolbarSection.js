import { connect } from 'react-redux';
import { ToolbarSection } from 'react-viewerbase';
import OHIF from 'ohif-core'

const { setToolActive } = OHIF.redux.actions;

const mapStateToProps = state => {
    return {
        buttons: state.tools.buttons,
        activeCommand: state.tools.buttons.find(tool => tool.active === true).command
    };
};

const mapDispatchToProps = dispatch => {
    return {
        setToolActive: tool => {
            console.log(`setViewportActive: ${tool}`);
            dispatch(setToolActive(tool))
        }
    };
};

const ConnectedToolbarSection = connect(
    mapStateToProps,
    mapDispatchToProps
)(ToolbarSection);

export default ConnectedToolbarSection;
