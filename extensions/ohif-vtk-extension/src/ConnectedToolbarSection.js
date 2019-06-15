import { connect } from 'react-redux';
import { ToolbarSection } from 'react-viewerbase';
import OHIF from 'ohif-core';

const { setToolActive } = OHIF.redux.actions;

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
      }
      /* Disabled temporarily due to issues with the interactor style
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
      },*/
    ],
    activeCommand: 'Crosshairs'
  };
};

const ConnectedToolbarSection = connect(
  mapStateToProps,
  null
)(ToolbarSection);

export default ConnectedToolbarSection;
