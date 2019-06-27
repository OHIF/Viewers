const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
  SET_TOOL_ACTIVE: 'setToolActive',
};

const definitions = [
  {
    id: 'Crosshairs',
    label: 'Crosshairs',
    icon: 'crosshairs',
    //
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'enableCrosshairsTool',
    commandOptions: {},
  },
  {
    id: 'WWWC',
    label: 'WWWC',
    icon: 'level',
    //
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'enableLevelTool',
    commandOptions: {},
  },
  {
    id: 'Rotate',
    label: 'Rotate',
    icon: '3d-rotate',
    //
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'enableRotateTool',
    commandOptions: {},
  },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::VTK',
};
