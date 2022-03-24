import { commandsManager } from '@ohif/viewer/src/App';
import csTools from 'cornerstone-tools';
import { PEPPERMINT_TOOL_NAMES } from '../peppermint-tools';
import KEY_COMMANDS from './keyCommands';
import refreshViewport from './refreshViewport';

export default function onKeyDownEvent(keyCommand) {
  if (keyCommand === KEY_COMMANDS.FREEHANDROI_CANCEL_DRAWING
    || keyCommand === KEY_COMMANDS.FREEHANDROI_COMPLETE_DRAWING) {
    const element = commandsManager.runCommand('getActiveViewportEnabledElement');
    const tool = csTools.getToolForElement(element, PEPPERMINT_TOOL_NAMES.FREEHAND_ROI_3D_TOOL);
    if (tool.mode === 'active') {
      if (keyCommand === KEY_COMMANDS.FREEHANDROI_CANCEL_DRAWING) {
        tool.cancelDrawing(element);
      } else if (keyCommand === KEY_COMMANDS.FREEHANDROI_COMPLETE_DRAWING) {
        tool.completeDrawing(element);
      }
    }
  } else if (keyCommand === KEY_COMMANDS.BRUSHTOOL_INCREASE_SIZE
    || keyCommand === KEY_COMMANDS.BRUSHTOOL_DECREASE_SIZE) {
    const module = csTools.getModule('segmentation');
    const { configuration } = csTools.getModule('segmentation');
    let radius = configuration.radius;
    if (keyCommand === KEY_COMMANDS.BRUSHTOOL_INCREASE_SIZE) {
      radius += 1;
    } else if (keyCommand === KEY_COMMANDS.BRUSHTOOL_DECREASE_SIZE) {
      radius -= 1;
    }
    module.setters.radius(radius);

    refreshViewport();
  }
};
