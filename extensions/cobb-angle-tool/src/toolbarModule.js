const TOOLBAR_BUTTON_TYPES = {
  SET_TOOL_ACTIVE: 'setToolActive',
};

const definitions = [
  {
    id: 'Cobb Angle',
    label: 'Cobb Angle',
    icon: 'angle-left',
    //
    type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
    commandName: 'setToolActive',
    commandOptions: { toolName: 'CobbAngle' },
  },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
