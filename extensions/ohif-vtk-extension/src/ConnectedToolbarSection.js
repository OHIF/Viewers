import OHIF from 'ohif-core';
import { ToolbarSection } from 'react-viewerbase';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {
    buttons: [
      {
        command: 'Crosshairs',
        type: 'tool',
        text: 'Crosshairs',
        icon: 'crosshairs',
        active: true,
        onClick: () => {
          // TODO: Make these use setToolActive instead
          window.commandsManager.runCommand('enableCrosshairsTool', {}, 'vtk');
        }
      },
      {
        command: 'WWWC',
        type: 'tool',
        text: 'WWWC',
        icon: 'level',
        active: true,
        onClick: () => {
          // TODO: Make these use setToolActive instead
          window.commandsManager.runCommand('enableLevelTool', {}, 'vtk');
        }
      },
      {
        command: 'Rotate',
        type: 'tool',
        text: 'Rotate',
        icon: '3d-rotate',
        active: false,
        onClick: () => {
          // TODO: Make these use setToolActive instead
          window.commandsManager.runCommand('enableRotateTool', {}, 'vtk');
        }
      }
    ]
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setToolActive: tool => {},
    activeCommand: 'Crosshairs'
  };
};

const ConnectedToolbarSection = connect(
  mapStateToProps,
  mapDispatchToProps
)(ToolbarSection);

export default ConnectedToolbarSection;
