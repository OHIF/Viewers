const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
  SET_TOOL_ACTIVE: 'setToolActive',
  BUILT_IN: 'builtIn',
};

const definitions = [
  {
    id: 'GoofyButton',
    label: '🎉 Goofy 🎉',
    icon: 'bars',
    //
    type: TOOLBAR_BUTTON_TYPES.COMMAND,
    commandName: 'doGoofyStuff',
    // commandOptions: { toolName: 'StackScroll' },
  },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
