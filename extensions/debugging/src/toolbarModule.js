const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
};

const definitions = [
  {
    id: 'Debug Info',
    label: 'Debug Info',
    icon: 'cog',
    //
    type: TOOLBAR_BUTTON_TYPES.COMMAND,
    commandName: 'openDebugInfoModal',
    context: 'VIEWER',
  },
];

export default {
  definitions,
  defaultContext: 'VIEWER',
};
