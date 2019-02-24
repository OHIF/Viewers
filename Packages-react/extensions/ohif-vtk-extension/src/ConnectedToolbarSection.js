import { connect } from 'react-redux';
import { ToolbarSection } from 'react-viewerbase';
import OHIF from 'ohif-core'

const { setToolActive } = OHIF.redux.actions;

const mapStateToProps = state => {
  const activeButton = state.tools.buttons.find(tool => tool.active === true);

  return {
    buttons: [  {
      command: 'Rotate',
      type: 'tool',
      text: 'Rotate',
      iconClasses: 'fa fa-rotate',
      //svgUrl: `${Icons}#icon-tools-stack-scroll`,
      active: true
    }],
    activeCommand: 'Rotate'
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setToolActive: tool => {
      //dispatch(setToolActive(tool.command))
    }
  };
};

const ConnectedToolbarSection = connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolbarSection);

export default ConnectedToolbarSection;
