const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
};

const definitions = [
  {
    id: 'TagBrowser',
    label: 'Tag Browser',
    icon: 'cube',
    //
    type: TOOLBAR_BUTTON_TYPES.COMMAND,
    commandName: 'openDICOMTagViewer',
    context: 'ACTIVE_VIEWPORT::CORNERSTONE',
  },
];

export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
