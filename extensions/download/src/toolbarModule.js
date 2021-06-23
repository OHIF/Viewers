const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
};

const definitions = [
  {
    id: 'Download Study',
    label: 'Download Study',
    icon: 'database',
    //
    type: TOOLBAR_BUTTON_TYPES.COMMAND,
    commandName: 'downloadAndZipStudyOnActiveViewport',
    context: 'VIEWER',
  },
];

export default {
  definitions,
  defaultContext: 'VIEWER',
};
