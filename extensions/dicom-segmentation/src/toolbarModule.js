/* TODO: Creation tools (future release).

const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
  SET_TOOL_ACTIVE: 'setToolActive',
  BUILT_IN: 'builtIn',
};

*/

const definitions = []; /* TODO: Creation tools (future release). [
  {
    id: 'SegDropdown',
    label: 'Segmentation',
    icon: 'ellipse-circle',
    buttons: [
      {
        id: 'Brush',
        label: 'Brush',
        icon: 'brush',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'Brush' },
      },
      {
        id: 'SphericalBrush',
        label: 'Spherical',
        icon: 'sphere',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'SphericalBrush' },
      },
      {
        id: 'CorrectionScissors',
        label: 'Correction Scissors',
        icon: 'scissors',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'CorrectionScissors' },
      },
      {
        id: 'BrushEraser',
        label: 'Eraser',
        icon: 'trash',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'BrushEraser' },
      },
    ],
  },
]; */

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
