const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
};

const definitions = [
  {
    id: 'TagBrowser',
    label: 'Tag Browser',
    icon: 'list',
    //
    type: TOOLBAR_BUTTON_TYPES.COMMAND,
    commandName: 'openDICOMTagViewer',
    context: 'VIEWER',
  },
];

export default {
  definitions,
  defaultContext: 'VIEWER',
};
