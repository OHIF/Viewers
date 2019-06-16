import { connect } from 'react-redux';
import { ToolbarSection } from 'react-viewerbase';
import OHIF from 'ohif-core';

const mapStateToProps = state => {
  const activeButton = state.tools.buttons.find(tool => tool.active === true);

  return {
    buttons: [
      {
        command: 'Rotate',
        type: 'tool',
        text: 'Rotate',
        icon: '3d-rotate',
        active: true
      }
    ],
    activeCommand: 'Rotate'
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setToolActive: tool => {}
  };
};

const ConnectedToolbarSection = connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolbarSection);

export default ConnectedToolbarSection;
