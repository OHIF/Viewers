import { connect } from 'react-redux';
import { ToolbarSection } from 'react-viewerbase';
import OHIF from 'ohif-core'

const { setToolActive } = OHIF.redux.actions;

const mapStateToProps = state => {
  const activeButton = state.tools.buttons.find(tool => tool.active === true);

  return {
    buttons: state.tools.buttons,
    activeCommand: activeButton && activeButton.command
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setToolActive: tool => {
      dispatch(setToolActive(tool.command))
    }
  };
};

const ConnectedToolbarSection = connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolbarSection);

export default ConnectedToolbarSection;
